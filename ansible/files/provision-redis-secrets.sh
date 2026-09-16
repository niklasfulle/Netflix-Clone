#!/bin/sh
# Keep LF line endings so Linux can execute this shebang after Ansible copies it.
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: provision-redis-secrets <staging|production> <secret-directory>" >&2
  exit 64
fi

deployment_environment=$1
secret_directory=$2

case "$deployment_environment" in
  staging|production) ;;
  *)
    echo "deployment environment must be staging or production" >&2
    exit 64
    ;;
esac

if [ "$(id -u)" -ne 0 ]; then
  echo "Redis secrets must be provisioned by root" >&2
  exit 77
fi

umask 077
install -d -o root -g root -m 0700 "$secret_directory"

acl_file="$secret_directory/redis-users.acl"
app_env_file="$secret_directory/redis-app.env"
health_env_file="$secret_directory/redis-health.env"
existing_count=0

for secret_file in "$acl_file" "$app_env_file" "$health_env_file"; do
  if [ -e "$secret_file" ]; then
    existing_count=$((existing_count + 1))
  fi
done

if [ "$existing_count" -ne 0 ] && [ "$existing_count" -ne 3 ]; then
  echo "all Redis secret files must exist together; refusing a partial credential set" >&2
  exit 78
fi

validate_private_env_file() {
  secret_file=$1
  [ -f "$secret_file" ] || {
    echo "Redis secret path is not a regular file" >&2
    exit 78
  }
  [ "$(stat -c '%u:%g:%a' "$secret_file")" = "0:0:600" ] || {
    echo "Redis secret files must be root-owned with mode 0600" >&2
    exit 78
  }
}

if [ "$existing_count" -eq 3 ]; then
  [ -f "$acl_file" ] || {
    echo "Redis ACL path is not a regular file" >&2
    exit 78
  }
  acl_permissions=$(stat -c '%u:%g:%a' "$acl_file")
  case "$acl_permissions" in
    0:0:600|0:0:640|0:1000:600|0:1000:640) ;;
    *)
      echo "Redis ACL file has unsafe ownership or permissions" >&2
      exit 78
      ;;
  esac
  validate_private_env_file "$app_env_file"
  validate_private_env_file "$health_env_file"

  grep -Fqx "REDIS_KEY_PREFIX=netflix:${deployment_environment}:" "$app_env_file" || {
    echo "Redis credentials belong to a different deployment environment" >&2
    exit 78
  }
  grep -Fq "~netflix:${deployment_environment}:*" "$acl_file" || {
    echo "Redis ACL belongs to a different deployment environment" >&2
    exit 78
  }

  if [ "$acl_permissions" != "0:1000:640" ]; then
    chown root:1000 "$acl_file"
    chmod 0640 "$acl_file"
    echo "updated"
  else
    echo "unchanged"
  fi
  exit 0
fi

command -v openssl >/dev/null 2>&1 || {
  echo "openssl is required to provision Redis credentials" >&2
  exit 69
}

temporary_directory=$(mktemp -d "$secret_directory/.redis-secrets.XXXXXX")
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

app_password=$(openssl rand -hex 32)
health_password=$(openssl rand -hex 32)

{
  printf 'user default off\n'
  printf 'user app on >%s ~netflix:%s:* &netflix:%s:* +@read +@write +@scripting +@connection -@dangerous -flushall -flushdb -config -acl -module -debug -shutdown -replicaof -slaveof\n' \
    "$app_password" "$deployment_environment" "$deployment_environment"
  printf 'user health on >%s -@all +ping +info +acl|whoami\n' "$health_password"
} > "$temporary_directory/redis-users.acl"

{
  printf 'REDIS_URL=redis://app:%s@redis-runtime:6379/0\n' "$app_password"
  printf 'REDIS_KEY_PREFIX=netflix:%s:\n' "$deployment_environment"
} > "$temporary_directory/redis-app.env"

printf 'REDISCLI_AUTH=%s\n' "$health_password" \
  > "$temporary_directory/redis-health.env"

chown root:1000 "$temporary_directory/redis-users.acl"
chmod 0640 "$temporary_directory/redis-users.acl"
chown root:root \
  "$temporary_directory/redis-app.env" \
  "$temporary_directory/redis-health.env"
chmod 0600 \
  "$temporary_directory/redis-app.env" \
  "$temporary_directory/redis-health.env"

for secret_name in redis-users.acl redis-app.env redis-health.env; do
  mv "$temporary_directory/$secret_name" "$secret_directory/$secret_name"
done

echo "created"
