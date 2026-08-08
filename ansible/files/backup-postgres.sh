#!/bin/sh

set -eu
set -f

: "${POSTGRESQL_URL:?POSTGRESQL_URL is required}"
strip_prisma_schema_parameter() {
  connection_url=$1

  case "$connection_url" in
    *\?*)
      base_url=${connection_url%%\?*}
      query=${connection_url#*\?}
      ;;
    *)
      printf '%s\n' "$connection_url"
      return
      ;;
  esac

  sanitized_query=
  previous_ifs=$IFS
  IFS='&'
  set -- $query
  IFS=$previous_ifs

  for parameter do
    case "$parameter" in
      schema=*) continue ;;
    esac

    if [ -n "$sanitized_query" ]; then
      sanitized_query="${sanitized_query}&${parameter}"
    else
      sanitized_query=$parameter
    fi
  done

  if [ -n "$sanitized_query" ]; then
    printf '%s?%s\n' "$base_url" "$sanitized_query"
  else
    printf '%s\n' "$base_url"
  fi
}

redact_diagnostics() {
  sed -E \
    -e 's#(postgres(ql)?://)[^/@:[:space:]]+:[^/@[:space:]]+@#\1[redacted]@#g' \
    -e 's/(password=)[^[:space:]]+/\1[redacted]/g' \
    "$1" >&2
}

database_url=$(strip_prisma_schema_parameter "$POSTGRESQL_URL")

if [ "${1:-backup}" = "failed-migration-status" ]; then
  migration_name=${2:?Migration name is required}
  case "$migration_name" in
    *[!0-9A-Za-z_-]*)
      echo "Migration name contains unsupported characters." >&2
      exit 2
      ;;
  esac

  status_error_log=/tmp/postgres-failed-migration-status-error.log
  if ! psql --no-align --tuples-only --set ON_ERROR_STOP=1 "$database_url" \
    --command "SELECT CASE WHEN EXISTS (SELECT 1 FROM public._prisma_migrations WHERE migration_name = '${migration_name}' AND finished_at IS NULL AND rolled_back_at IS NULL) THEN CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'isBlocked') THEN 'failed-schema-present' ELSE 'failed-schema-missing' END ELSE 'clear' END" \
    2>"$status_error_log"; then
    redact_diagnostics "$status_error_log"
    rm -f "$status_error_log"
    exit 1
  fi
  rm -f "$status_error_log"
  exit 0
fi

if [ "${1:-backup}" = "migration-table-status" ]; then
  status_error_log=/tmp/postgres-migration-status-error.log
  if ! psql --no-align --tuples-only --set ON_ERROR_STOP=1 "$database_url" \
    --command "SELECT CASE WHEN to_regclass('public._prisma_migrations') IS NULL THEN 'missing' ELSE 'present' END" \
    2>"$status_error_log"; then
    redact_diagnostics "$status_error_log"
    rm -f "$status_error_log"
    exit 1
  fi
  rm -f "$status_error_log"
  exit 0
fi

if [ "${1:-backup}" != "backup" ]; then
  echo "Unknown PostgreSQL deployment helper operation." >&2
  exit 2
fi

: "${BACKUP_PATH:?BACKUP_PATH is required}"

case "$BACKUP_PATH" in
  /backups/*.dump) ;;
  *)
    echo "Backup path must be a .dump file below /backups." >&2
    exit 2
    ;;
esac

temporary_backup="${BACKUP_PATH}.tmp"
error_log="${BACKUP_PATH}.error.log"

cleanup() {
  rm -f "$temporary_backup"
}
trap cleanup EXIT HUP INT TERM

if ! pg_dump --format=custom --file="$temporary_backup" "$database_url" 2>"$error_log"; then
  redact_diagnostics "$error_log"
  exit 1
fi

if ! pg_restore --list "$temporary_backup" >/dev/null 2>"$error_log"; then
  redact_diagnostics "$error_log"
  exit 1
fi

mv "$temporary_backup" "$BACKUP_PATH"
rm -f "$error_log"
trap - EXIT HUP INT TERM
