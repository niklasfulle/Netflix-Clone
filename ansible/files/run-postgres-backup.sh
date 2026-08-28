#!/bin/bash

set -euo pipefail
set -f

backup_directory=/root/netflix-database-backups
status_directory=/var/lib/netflix-backup-status/scheduled
status_path="$status_directory/latest.json"
request_path="$status_directory/request.json"
lock_path=/run/lock/netflix-postgres-backup.lock
app_environment_file=/root/netflix-secrets/app.env
backup_helper=/usr/local/lib/netflix-deploy/backup-postgres.sh
verification_runner=/usr/local/lib/netflix-deploy/run-postgres-backup-verification.sh
retention_manager=/usr/local/lib/netflix-deploy/manage-postgres-backups.py
postgres_image=${POSTGRES_BACKUP_IMAGE:-postgres:18-alpine}
lock_wait_seconds=${POSTGRES_BACKUP_LOCK_WAIT_SECONDS:-30}
backup_timeout_seconds=${POSTGRES_BACKUP_TIMEOUT_SECONDS:-900}
minimum_copies=${POSTGRES_BACKUP_MINIMUM_COPIES:-3}
daily_days=${POSTGRES_BACKUP_RETENTION_DAILY_DAYS:-7}
weekly_weeks=${POSTGRES_BACKUP_RETENTION_WEEKLY_WEEKS:-4}
monthly_months=${POSTGRES_BACKUP_RETENTION_MONTHLY_MONTHS:-6}
request_id=

mkdir -p "$backup_directory" "$status_directory" /run/lock

case "${DEPLOYMENT_ENVIRONMENT:-}" in
  staging|production) ;;
  *) echo "DEPLOYMENT_ENVIRONMENT must be staging or production" >&2; exit 2 ;;
esac

if [[ -e "$request_path" || -L "$request_path" ]]; then
  if [[ ! -f "$request_path" || -L "$request_path" ]]; then
    echo "Scheduled backup request path must be a regular file" >&2
    exit 2
  fi
  if [[ $(stat -c '%s' -- "$request_path") -gt 4096 ]]; then
    echo "Scheduled backup request is too large" >&2
    exit 2
  fi
  request_id=$(python3 - "$request_path" "$DEPLOYMENT_ENVIRONMENT" <<'PY'
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as request_file:
    request = json.load(request_file)
request_id = request.get("requestId")
valid_id = isinstance(request_id, str) and re.fullmatch(
    r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
    request_id,
    re.IGNORECASE,
)
if request.get("schemaVersion") != 1 or request.get("environment") != sys.argv[2] or not valid_id:
    raise SystemExit("Invalid scheduled backup request")
print(request_id)
PY
  )
  rm -- "$request_path"
fi

write_status() {
  local result=$1
  local diagnostic_code=$2
  local backup_name=${3:-}
  local checksum=${4:-}
  local completed_at=${5:-}
  local temporary_path="${status_path}.tmp"
  printf '{"schemaVersion":1,"requestId":%s,"environment":"%s","backupName":%s,"status":"%s","diagnosticCode":"%s","checksumSha256":%s,"completedAt":%s}\n' \
    "$(if [[ -n "$request_id" ]]; then printf '"%s"' "$request_id"; else printf null; fi)" \
    "$DEPLOYMENT_ENVIRONMENT" \
    "$(if [[ -n "$backup_name" ]]; then printf '"%s"' "$backup_name"; else printf null; fi)" \
    "$result" \
    "$diagnostic_code" \
    "$(if [[ -n "$checksum" ]]; then printf '"%s"' "$checksum"; else printf null; fi)" \
    "$(if [[ -n "$completed_at" ]]; then printf '"%s"' "$completed_at"; else printf null; fi)" \
    >"$temporary_path"
  chown 10001:10001 "$temporary_path"
  chmod 0640 "$temporary_path"
  mv "$temporary_path" "$status_path"
}

for numeric_value in \
  "$lock_wait_seconds" "$backup_timeout_seconds" "$minimum_copies" \
  "$daily_days" "$weekly_weeks" "$monthly_months"; do
  [[ "$numeric_value" =~ ^[1-9][0-9]{0,4}$ ]] || exit 2
done

exec 9>"$lock_path"
if ! flock -w "$lock_wait_seconds" 9; then
  write_status FAILED LOCK_TIMEOUT '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 75
fi

timestamp=$(date -u '+%Y%m%dT%H%M%SZ')
backup_name="scheduled-${DEPLOYMENT_ENVIRONMENT}-${timestamp}.dump"
backup_path="$backup_directory/$backup_name"
checksum_path="${backup_path}.sha256"
checksum_temporary_path="${backup_path}.sha256.tmp"
trap 'rm -f "$checksum_temporary_path"' EXIT HUP INT TERM
write_status RUNNING BACKUP_RUNNING "$backup_name"

set +e
timeout --signal=TERM --kill-after=30s "${backup_timeout_seconds}s" \
  docker run --rm \
    --env-file "$app_environment_file" \
    --env "BACKUP_PATH=/backups/$backup_name" \
    --volume "$backup_directory:/backups" \
    --volume "$backup_helper:/usr/local/bin/backup-postgres:ro" \
    "$postgres_image" \
    /usr/local/bin/backup-postgres
backup_exit=$?
set -e
if [[ "$backup_exit" -eq 124 || "$backup_exit" -eq 137 ]]; then
  write_status FAILED BACKUP_TIMEOUT "$backup_name" '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi
if [[ "$backup_exit" -ne 0 || ! -s "$backup_path" || -L "$backup_path" ]]; then
  write_status FAILED BACKUP_FAILED "$backup_name" '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi

checksum=$(sha256sum "$backup_path" | awk '{print $1}')
[[ "$checksum" =~ ^[a-f0-9]{64}$ ]] || exit 1
printf '%s  %s\n' "$checksum" "$backup_name" >"$checksum_temporary_path"
chmod 0600 "$checksum_temporary_path"

if ! POSTGRES_BACKUP_IMAGE="$postgres_image" \
  "$verification_runner" "$backup_path"; then
  write_status FAILED VERIFICATION_FAILED "$backup_name" "$checksum" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi
if ! grep -Fq "\"backupName\":\"$backup_name\",\"status\":\"VERIFIED\"" \
  /var/lib/netflix-backup-status/verification/latest.json; then
  write_status FAILED VERIFICATION_FAILED "$backup_name" "$checksum" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi

mv "$checksum_temporary_path" "$checksum_path"
trap - EXIT HUP INT TERM

"$retention_manager" \
  --backup-directory "$backup_directory" \
  --environment "$DEPLOYMENT_ENVIRONMENT" \
  --minimum-copies "$minimum_copies" \
  --daily-days "$daily_days" \
  --weekly-weeks "$weekly_weeks" \
  --monthly-months "$monthly_months" \
  --protected-backup "$backup_name"

write_status VERIFIED BACKUP_VERIFIED "$backup_name" "$checksum" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
