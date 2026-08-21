#!/bin/sh
set -eu

source_certificate="${1:-}"
destination_root="${2:-}"
allow_rotation="${3:-false}"
retire_previous="${4:-false}"
overlap_days="${5:-30}"

if [ "$destination_root" != "/var/lib/netflix-public-certificates" ]; then
  echo "Refusing unexpected public certificate directory" >&2
  exit 64
fi

case "$allow_rotation:$retire_previous" in
  false:false|true:false|true:true) ;;
  *) echo "Invalid certificate rotation controls" >&2; exit 64 ;;
esac

case "$overlap_days" in
  ''|*[!0-9]*) echo "Invalid certificate overlap duration" >&2; exit 64 ;;
esac
if [ "$overlap_days" -lt 1 ] || [ "$overlap_days" -gt 90 ]; then
  echo "Certificate overlap duration must be between 1 and 90 days" >&2
  exit 64
fi

validate_certificate() {
  certificate_path="$1"
  [ -f "$certificate_path" ] && [ ! -L "$certificate_path" ] || return 1
  certificate_size="$(wc -c < "$certificate_path")"
  [ "$certificate_size" -gt 0 ] && [ "$certificate_size" -le 65536 ] || return 1
  if find "$certificate_path" -maxdepth 0 -perm /022 -print -quit | grep -q .; then
    return 1
  fi
  ! grep -q "PRIVATE KEY" "$certificate_path" || return 1
  openssl x509 -in "$certificate_path" -noout -checkend 0 >/dev/null 2>&1 || return 1
  openssl x509 -in "$certificate_path" -noout -text 2>/dev/null | grep -q "CA:TRUE" || return 1
}

validate_certificate "$source_certificate" || {
  echo "Exported certificate failed public CA validation" >&2
  exit 65
}

mkdir -p "$destination_root"
chmod 0755 "$destination_root"
current="$destination_root/current.pem"
previous="$destination_root/previous.pem"
current_tmp="$destination_root/.current.pem.tmp"
previous_tmp="$destination_root/.previous.pem.tmp"
trap 'rm -f "$current_tmp" "$previous_tmp"' EXIT HUP INT TERM

source_fingerprint="$(openssl x509 -in "$source_certificate" -noout -fingerprint -sha256)"
if [ -e "$current" ]; then
  validate_certificate "$current" || {
    echo "Existing public root is unsafe or invalid" >&2
    exit 66
  }
  current_fingerprint="$(openssl x509 -in "$current" -noout -fingerprint -sha256)"
  if [ "$source_fingerprint" != "$current_fingerprint" ]; then
    if [ "$allow_rotation" != "true" ]; then
      echo "Public root changed; rerun with explicit rotation approval" >&2
      exit 67
    fi
    cp "$current" "$previous_tmp"
    chown root:root "$previous_tmp"
    chmod 0644 "$previous_tmp"
    mv -f "$previous_tmp" "$previous"
  fi
fi

cp "$source_certificate" "$current_tmp"
chown root:root "$current_tmp"
chmod 0644 "$current_tmp"
validate_certificate "$current_tmp" || {
  echo "Copied public root failed validation" >&2
  exit 68
}
mv -f "$current_tmp" "$current"
echo "published current public root"

if [ "$retire_previous" = "true" ] && [ -f "$previous" ] && [ ! -L "$previous" ]; then
  rm -f "$previous"
  echo "retired previous public root"
elif [ -f "$previous" ] && [ ! -L "$previous" ] \
  && find "$previous" -maxdepth 0 -mtime "+$overlap_days" -print -quit | grep -q .; then
  rm -f "$previous"
  echo "retired expired previous public root"
fi
