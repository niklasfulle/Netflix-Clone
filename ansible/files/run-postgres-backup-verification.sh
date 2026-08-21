#!/bin/bash

set -euo pipefail
set -f

backup_directory=/root/netflix-database-backups
status_directory=/var/lib/netflix-backup-status/verification
request_path="$status_directory/request.json"
status_path="$status_directory/latest.json"
lock_path=/run/lock/netflix-backup-verification.lock
verifier_path=/usr/local/lib/netflix-deploy/verify-postgres-backup.sh
postgres_image=${POSTGRES_BACKUP_IMAGE:-postgres:18-alpine}
lock_wait_seconds=${BACKUP_VERIFY_LOCK_WAIT_SECONDS:-5}
restore_timeout_seconds=${BACKUP_VERIFY_RESTORE_TIMEOUT_SECONDS:-300}
overall_timeout_seconds=${BACKUP_VERIFY_OVERALL_TIMEOUT_SECONDS:-420}
explicit_backup=${1:-}
manual_request=0
request_id=

mkdir -p "$status_directory" /run/lock

json_string_or_null() {
  if [[ -n "$1" ]]; then
    printf '"%s"' "$1"
  else
    printf 'null'
  fi
}

write_host_status() {
  local verification_status=$1
  local diagnostic_code=$2
  local backup_name=${3:-}
  local completed_at=${4:-}
  local started_at temporary_path
  started_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  temporary_path="${status_path}.host.tmp"
  printf '{"schemaVersion":1,"requestId":%s,"backupName":%s,"status":"%s","format":"unknown","sizeBytes":null,"checksumSha256":null,"sourcePostgresVersion":null,"dumpToolVersion":null,"verificationPostgresVersion":null,"startedAt":"%s","completedAt":%s,"diagnosticCode":"%s","checks":null}\n' \
    "$(json_string_or_null "$request_id")" \
    "$(json_string_or_null "$backup_name")" \
    "$verification_status" \
    "$started_at" \
    "$(json_string_or_null "$completed_at")" \
    "$diagnostic_code" >"$temporary_path"
  chown 10001:10001 "$temporary_path"
  chmod 0640 "$temporary_path"
  mv "$temporary_path" "$status_path"
}

emit_failure_diagnostic() {
  local diagnostic_code
  diagnostic_code=$(sed -n 's/.*"diagnosticCode":"\([A-Z_][A-Z_]*\)".*/\1/p' "$status_path" | head -n 1)

  if [[ -n "$diagnostic_code" ]]; then
    printf 'backup verification failed: %s\n' "$diagnostic_code" >&2
  else
    printf 'backup verification failed: no bounded diagnostic is available\n' >&2
  fi
}

cleanup_request() {
  if [[ "$manual_request" -eq 1 ]]; then
    rm -f "$request_path"
  fi
}

exec 9>"$lock_path"
if ! flock -w "$lock_wait_seconds" 9; then
  exit 75
fi

if [[ -z "$explicit_backup" && -f "$request_path" && ! -L "$request_path" ]]; then
  manual_request=1
  request_id=$(sed -n 's/.*"requestId":"\([0-9A-Za-z_-]*\)".*/\1/p' "$request_path" | head -n 1)
  if [[ ! "$request_id" =~ ^[0-9A-Za-z_-]{1,128}$ ]]; then
    request_id=
  fi
fi
trap cleanup_request EXIT HUP INT TERM

if [[ -n "$explicit_backup" ]]; then
  backup_path=$explicit_backup
else
  backup_name=$(find "$backup_directory" -maxdepth 1 -type f -name '*.dump' \
    -printf '%T@ %f\n' | sort -n | tail -n 1 | cut -d' ' -f2-)
  if [[ -z "$backup_name" ]]; then
    write_host_status FAILED NO_BACKUP_AVAILABLE '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    emit_failure_diagnostic
    exit 1
  fi
  backup_path="$backup_directory/$backup_name"
fi

backup_name=$(basename -- "$backup_path")
if [[ ! "$backup_name" =~ ^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$ ]]; then
  write_host_status FAILED VERIFIER_FAILED '' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  emit_failure_diagnostic
  exit 2
fi
resolved_backup=$(realpath -e -- "$backup_path")
expected_backup="$backup_directory/$backup_name"
if [[ "$resolved_backup" != "$expected_backup" || ! -f "$resolved_backup" || -L "$backup_path" ]]; then
  write_host_status FAILED VERIFIER_FAILED "$backup_name" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  emit_failure_diagnostic
  exit 2
fi

write_host_status PENDING VERIFICATION_REQUESTED "$backup_name"

set +e
timeout --signal=TERM --kill-after=15s "${overall_timeout_seconds}s" \
  docker run --rm \
    --network none \
    --read-only \
    --pids-limit 200 \
    --memory 1g \
    --cpus 1 \
    --tmpfs /tmp:size=768m,mode=1777 \
    --volume "$backup_directory:/backups:ro" \
    --volume "$status_directory:/status" \
    --volume "$verifier_path:/usr/local/bin/verify-postgres-backup:ro" \
    --env "BACKUP_PATH=/backups/$backup_name" \
    --env "STATUS_PATH=/status/latest.json" \
    --env "REQUEST_ID=$request_id" \
    --env "VERIFY_TIMEOUT_SECONDS=$restore_timeout_seconds" \
    --env "STATUS_UID=10001" \
    --env "STATUS_GID=10001" \
    "$postgres_image" \
    /usr/local/bin/verify-postgres-backup
verification_exit=$?
set -e

if [[ "$verification_exit" -eq 124 || "$verification_exit" -eq 137 ]]; then
  write_host_status TIMEOUT RESTORE_TIMEOUT "$backup_name" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  emit_failure_diagnostic
  exit 1
fi
if [[ "$verification_exit" -ne 0 ]]; then
  if grep -q '"diagnosticCode":"VERIFICATION_REQUESTED"' "$status_path" 2>/dev/null; then
    write_host_status FAILED VERIFIER_FAILED "$backup_name" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  fi
  emit_failure_diagnostic
  exit "$verification_exit"
fi
