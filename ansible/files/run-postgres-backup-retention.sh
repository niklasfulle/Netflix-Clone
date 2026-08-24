#!/bin/bash

set -euo pipefail
set -f

backup_directory=/root/netflix-database-backups
status_directory=/var/lib/netflix-backup-status/retention
request_path="$status_directory/request.json"
status_path="$status_directory/latest.json"
lock_path=/run/lock/netflix-postgres-backup.lock
retention_manager=/usr/local/lib/netflix-deploy/manage-postgres-backups.py
lock_wait_seconds=${POSTGRES_BACKUP_LOCK_WAIT_SECONDS:-30}
minimum_copies=${POSTGRES_BACKUP_MINIMUM_COPIES:-3}
daily_days=${POSTGRES_BACKUP_RETENTION_DAILY_DAYS:-7}
weekly_weeks=${POSTGRES_BACKUP_RETENTION_WEEKLY_WEEKS:-4}
monthly_months=${POSTGRES_BACKUP_RETENTION_MONTHLY_MONTHS:-6}
request_id=

mkdir -p "$backup_directory" "$status_directory" /run/lock

json_string_or_null() {
  if [[ -n "$1" ]]; then printf '"%s"' "$1"; else printf null; fi
}

write_status() {
  local result=$1 diagnostic_code=$2 retained=${3:-} removed=${4:-} completed_at=${5:-}
  local temporary_path="${status_path}.tmp"
  printf '{"schemaVersion":1,"requestId":%s,"environment":"%s","status":"%s","diagnosticCode":"%s","retainedCount":%s,"removedCount":%s,"completedAt":%s}\n' \
    "$(json_string_or_null "$request_id")" "$DEPLOYMENT_ENVIRONMENT" "$result" "$diagnostic_code" \
    "${retained:-null}" "${removed:-null}" "$(json_string_or_null "$completed_at")" \
    >"$temporary_path"
  chown 10001:10001 "$temporary_path"
  chmod 0640 "$temporary_path"
  mv "$temporary_path" "$status_path"
}

cleanup_request() {
  rm -f "$request_path"
}
trap cleanup_request EXIT HUP INT TERM

case "${DEPLOYMENT_ENVIRONMENT:-}" in staging|production) ;; *) exit 2 ;; esac
for numeric_value in "$lock_wait_seconds" "$minimum_copies" "$daily_days" "$weekly_weeks" "$monthly_months"; do
  [[ "$numeric_value" =~ ^[1-9][0-9]{0,4}$ ]] || exit 2
done

if [[ ! -f "$request_path" || -L "$request_path" ]] || [[ $(stat -c '%s' "$request_path") -gt 4096 ]]; then
  write_status FAILED INVALID_REQUEST '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 2
fi

mapfile -t request_fields < <(python3 - "$request_path" <<'PY'
import datetime as dt
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as request_file:
    request = json.load(request_file)
request_id = request.get("requestId", "")
environment = request.get("environment", "")
requested_at = request.get("requestedAt", "")
if request.get("schemaVersion") != 1:
    raise SystemExit(2)
if not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", request_id, re.I):
    raise SystemExit(2)
if environment not in ("staging", "production"):
    raise SystemExit(2)
dt.datetime.fromisoformat(requested_at.replace("Z", "+00:00"))
print(request_id)
print(environment)
PY
)
if [[ ${#request_fields[@]} -ne 2 ]]; then
  write_status FAILED INVALID_REQUEST '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 2
fi
request_id=${request_fields[0]}
if [[ ${request_fields[1]} != "$DEPLOYMENT_ENVIRONMENT" ]]; then
  write_status FAILED ENVIRONMENT_MISMATCH '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 2
fi

exec 9>"$lock_path"
if ! flock -w "$lock_wait_seconds" 9; then
  write_status BUSY LOCK_TIMEOUT '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 75
fi

write_status RUNNING RETENTION_RUNNING
protected_backup=$(find "$backup_directory" -maxdepth 1 -type f \
  -name "scheduled-${DEPLOYMENT_ENVIRONMENT}-*.dump" -printf '%T@ %f\n' \
  | sort -n | tail -n 1 | cut -d' ' -f2-)

if ! result_json=$("$retention_manager" \
  --backup-directory "$backup_directory" \
  --environment "$DEPLOYMENT_ENVIRONMENT" \
  --minimum-copies "$minimum_copies" \
  --daily-days "$daily_days" \
  --weekly-weeks "$weekly_weeks" \
  --monthly-months "$monthly_months" \
  --protected-backup "$protected_backup"); then
  write_status FAILED RETENTION_FAILED '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi

mapfile -t result_fields < <(python3 -c \
  'import json,sys; result=json.load(sys.stdin); print(result["retained"]); print(len(result["removed"]))' \
  <<<"$result_json")
if [[ ${#result_fields[@]} -ne 2 || ! ${result_fields[0]} =~ ^[0-9]{1,7}$ || ! ${result_fields[1]} =~ ^[0-9]{1,7}$ ]]; then
  write_status FAILED RETENTION_FAILED '' '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  exit 1
fi
write_status COMPLETED RETENTION_COMPLETED "${result_fields[0]}" "${result_fields[1]}" \
  "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
