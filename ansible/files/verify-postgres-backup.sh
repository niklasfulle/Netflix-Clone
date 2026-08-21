#!/bin/sh

set -eu
set -f

: "${BACKUP_PATH:?BACKUP_PATH is required}"
: "${STATUS_PATH:=/status/latest.json}"
: "${VERIFY_TIMEOUT_SECONDS:=300}"
: "${STATUS_UID:=10001}"
: "${STATUS_GID:=10001}"

case "$BACKUP_PATH" in
  /backups/*.dump) ;;
  *) exit 2 ;;
esac

case "$STATUS_PATH" in
  /status/*.json) ;;
  *) exit 2 ;;
esac

case "$VERIFY_TIMEOUT_SECONDS" in
  ''|*[!0-9]*) exit 2 ;;
esac

backup_name=${BACKUP_PATH##*/}
case "$backup_name" in
  ''|*[!0-9A-Za-z._-]*) exit 2 ;;
esac

request_id=${REQUEST_ID:-}
case "$request_id" in
  *[!0-9A-Za-z_-]*) request_id= ;;
esac

work_directory="/tmp/netflix-backup-verification.$$"
data_directory="$work_directory/data"
socket_directory="$work_directory/socket"
archive_list="$work_directory/archive.list"
error_log="$work_directory/error.log"
restore_database=netflix_restore_verification
restore_port=55432
server_started=0

format=unknown
size_bytes=null
checksum_sha256=null
source_postgres_version=null
dump_tool_version=null
verification_postgres_version=null
started_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

json_string_or_null() {
  if [ -n "$1" ] && [ "$1" != null ]; then
    printf '"%s"' "$1"
  else
    printf 'null'
  fi
}

write_status() {
  verification_status=$1
  diagnostic_code=$2
  completed_at=${3:-}
  public_table_count=${4:-null}
  migration_count=${5:-null}
  user_count=${6:-null}
  content_count=${7:-null}
  status_temporary_path="${STATUS_PATH}.tmp"

  if [ "$public_table_count" = null ]; then
    checks_json=null
  else
    checks_json=$(printf '{"publicTableCount":%s,"migrationCount":%s,"userCount":%s,"contentCount":%s}' \
      "$public_table_count" "$migration_count" "$user_count" "$content_count")
  fi

  printf '{"schemaVersion":1,"requestId":%s,"backupName":"%s","status":"%s","format":"%s","sizeBytes":%s,"checksumSha256":%s,"sourcePostgresVersion":%s,"dumpToolVersion":%s,"verificationPostgresVersion":%s,"startedAt":"%s","completedAt":%s,"diagnosticCode":"%s","checks":%s}\n' \
    "$(json_string_or_null "$request_id")" \
    "$backup_name" \
    "$verification_status" \
    "$format" \
    "$size_bytes" \
    "$(json_string_or_null "$checksum_sha256")" \
    "$(json_string_or_null "$source_postgres_version")" \
    "$(json_string_or_null "$dump_tool_version")" \
    "$(json_string_or_null "$verification_postgres_version")" \
    "$started_at" \
    "$(json_string_or_null "$completed_at")" \
    "$diagnostic_code" \
    "$checks_json" >"$status_temporary_path"
  chmod 0640 "$status_temporary_path"
  chown "$STATUS_UID:$STATUS_GID" "$status_temporary_path"
  mv "$status_temporary_path" "$STATUS_PATH"
}

completed_now() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

fail_verification() {
  write_status "$1" "$2" "$(completed_now)"
  exit "${3:-1}"
}

restore_permission_failure_code() {
  if grep -Eq '^[[:space:]]*Command was:[[:space:]]*SET[[:space:]]' "$error_log"; then
    printf '%s' RESTORE_PERMISSION_DENIED_SET
  elif grep -Eq '^[[:space:]]*Command was:[[:space:]]*CREATE[[:space:]]' "$error_log"; then
    printf '%s' RESTORE_PERMISSION_DENIED_CREATE
  elif grep -Eq '^[[:space:]]*Command was:[[:space:]]*ALTER[[:space:]]' "$error_log"; then
    printf '%s' RESTORE_PERMISSION_DENIED_ALTER
  else
    printf '%s' RESTORE_PERMISSION_DENIED
  fi
}

restore_failure_code() {
  if grep -Eqi 'extension.*(is not available|control file)|could not open extension' "$error_log"; then
    printf '%s' RESTORE_EXTENSION_UNAVAILABLE
  elif grep -Eqi 'no space left on device|disk full|could not write to file' "$error_log"; then
    printf '%s' RESTORE_STORAGE_EXHAUSTED
  elif grep -Eqi 'already exists|duplicate key value' "$error_log"; then
    printf '%s' RESTORE_CONFLICT
  elif grep -Eqi 'role .* does not exist' "$error_log"; then
    printf '%s' RESTORE_ROLE_MISSING
  elif grep -Eqi 'permission denied|must be owner' "$error_log"; then
    restore_permission_failure_code
  elif grep -Eqi 'unsupported version|unrecognized configuration parameter|transaction_timeout' "$error_log"; then
    printf '%s' POSTGRES_VERSION_INCOMPATIBLE
  elif grep -Eqi 'could not connect|connection (refused|failed)' "$error_log"; then
    printf '%s' RESTORE_CONNECTION_FAILED
  else
    printf '%s' RESTORE_FAILED
  fi
}

cleanup() {
  if [ "$server_started" -eq 1 ]; then
    gosu postgres pg_ctl -D "$data_directory" -m immediate -w stop >/dev/null 2>&1 || true
  fi
  rm -rf "$work_directory"
}

interrupted() {
  write_status INTERRUPTED VERIFICATION_INTERRUPTED "$(completed_now)"
  exit 143
}

trap cleanup EXIT
trap interrupted HUP INT TERM

mkdir -p "$data_directory" "$socket_directory"
chown -R postgres:postgres "$work_directory"

if [ ! -f "$BACKUP_PATH" ] || [ -L "$BACKUP_PATH" ]; then
  fail_verification CORRUPT ARCHIVE_CORRUPT
fi

size_bytes=$(wc -c <"$BACKUP_PATH" | tr -d ' ')
case "$size_bytes" in
  ''|*[!0-9]*) fail_verification CORRUPT ARCHIVE_CORRUPT ;;
esac
checksum_sha256=$(sha256sum "$BACKUP_PATH" | awk '{print $1}')
verification_postgres_version=$(postgres --version | awk '{print $NF}' | cut -d- -f1)

if [ "$size_bytes" -lt 512 ]; then
  fail_verification TRUNCATED ARCHIVE_TRUNCATED
fi

archive_header=$(dd if="$BACKUP_PATH" bs=1 count=5 2>/dev/null || true)
if [ "$archive_header" != PGDMP ]; then
  fail_verification CORRUPT ARCHIVE_CORRUPT
fi
format=pg-custom
write_status RUNNING VERIFICATION_RUNNING

if ! pg_restore --list "$BACKUP_PATH" >"$archive_list" 2>"$error_log"; then
  if grep -Eqi 'unsupported version' "$error_log"; then
    fail_verification INCOMPATIBLE POSTGRES_VERSION_INCOMPATIBLE
  fi
  if grep -Eqi 'end of file|unexpected end|could not read from input' "$error_log"; then
    fail_verification TRUNCATED ARCHIVE_TRUNCATED
  fi
  fail_verification CORRUPT ARCHIVE_CORRUPT
fi

source_postgres_version=$(sed -n 's/^;[[:space:]]*Dumped from database version:[[:space:]]*\([0-9][0-9.]*\).*/\1/p' "$archive_list" | head -n 1)
dump_tool_version=$(sed -n 's/^;[[:space:]]*Dumped by pg_dump version:[[:space:]]*\([0-9][0-9.]*\).*/\1/p' "$archive_list" | head -n 1)
case "$source_postgres_version:$dump_tool_version:$verification_postgres_version" in
  *[!0-9.:]*) fail_verification CORRUPT ARCHIVE_CORRUPT ;;
  ::*|*::*|*:) fail_verification CORRUPT ARCHIVE_CORRUPT ;;
esac

source_major=${source_postgres_version%%.*}
dump_tool_major=${dump_tool_version%%.*}
verification_major=${verification_postgres_version%%.*}
if [ "$source_major" -gt "$verification_major" ] || [ "$dump_tool_major" -gt "$verification_major" ]; then
  fail_verification INCOMPATIBLE POSTGRES_VERSION_INCOMPATIBLE
fi

if ! gosu postgres initdb -D "$data_directory" -A trust --no-locale --encoding=UTF8 \
  >/dev/null 2>"$error_log"; then
  fail_verification FAILED INITDB_FAILED
fi

if ! gosu postgres pg_ctl -D "$data_directory" \
  -o "-F -k $socket_directory -c listen_addresses='' -p $restore_port" \
  -w start >/dev/null 2>"$error_log"; then
  fail_verification FAILED SERVER_START_FAILED
fi
server_started=1

if ! gosu postgres createdb -h "$socket_directory" -p "$restore_port" "$restore_database" \
  >/dev/null 2>"$error_log"; then
  fail_verification FAILED DATABASE_CREATE_FAILED
fi

set +e
timeout "${VERIFY_TIMEOUT_SECONDS}s" pg_restore \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --host "$socket_directory" \
  --port "$restore_port" \
  --username postgres \
  --dbname "$restore_database" \
  "$BACKUP_PATH" >/dev/null 2>"$error_log"
restore_exit=$?
set -e

if [ "$restore_exit" -eq 124 ] || [ "$restore_exit" -eq 137 ]; then
  fail_verification TIMEOUT RESTORE_TIMEOUT
fi
if [ "$restore_exit" -ne 0 ]; then
  fail_verification FAILED "$(restore_failure_code)"
fi

query_database() {
  gosu postgres psql \
    --host "$socket_directory" \
    --port "$restore_port" \
    --dbname "$restore_database" \
    --no-align \
    --tuples-only \
    --set ON_ERROR_STOP=1 \
    --command "$1" 2>"$error_log"
}

if ! schema_presence=$(query_database \
  "SELECT CASE WHEN to_regclass('public.\"User\"') IS NOT NULL AND to_regclass('public.\"Movie\"') IS NOT NULL AND to_regclass('public._prisma_migrations') IS NOT NULL THEN 'ready' ELSE 'missing' END"); then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi
if [ "$schema_presence" != ready ]; then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi

if ! public_table_count=$(query_database "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'"); then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi
if ! migration_count=$(query_database 'SELECT count(*) FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'); then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi
if ! user_count=$(query_database 'SELECT count(*) FROM public."User"'); then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi
if ! content_count=$(query_database 'SELECT count(*) FROM public."Movie"'); then
  fail_verification FAILED SCHEMA_CHECK_FAILED
fi

for count in "$public_table_count" "$migration_count" "$user_count" "$content_count"; do
  case "$count" in
    ''|*[!0-9]*) fail_verification FAILED SCHEMA_CHECK_FAILED ;;
  esac
done

write_status VERIFIED VERIFICATION_SUCCEEDED "$(completed_now)" \
  "$public_table_count" "$migration_count" "$user_count" "$content_count"
