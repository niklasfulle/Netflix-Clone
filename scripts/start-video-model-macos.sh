#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  printf '%s\n' 'Start the pinned Qwen3-VL-8B Q4_K_M model on an Apple Silicon Mac.' 'Requires: brew install llama.cpp' 'Default: http://127.0.0.1:8080; set VIDEO_MODEL_BIND_HOST for LAN access.'
  exit 0
fi
if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  printf '%s\n' 'This script requires an Apple Silicon Mac.' >&2
  exit 1
fi
if ! command -v llama-server >/dev/null 2>&1; then
  printf '%s\n' 'Install llama.cpp first: brew install llama.cpp' >&2
  exit 1
fi

model_dir="${XDG_CACHE_HOME:-$HOME/.cache}/netflix-video-models/qwen3-vl-8b-5bcaa9cc"
revision='5bcaa9cc11a22c7ddeade75f0c84b51e43b3f7ab'
mkdir -p "$model_dir"
temporary=''
trap 'if [[ -n "$temporary" ]]; then rm -f "$temporary"; fi' EXIT
download() {
  local name="$1" expected="$2" destination="$model_dir/$1"
  if [[ -f "$destination" ]] && [[ "$(shasum -a 256 "$destination" | awk '{print $1}')" == "$expected" ]]; then return; fi
  temporary="$(mktemp "$model_dir/download.XXXXXX")"
  printf 'Downloading %s\n' "$name"
  curl --fail --location --proto '=https' --tlsv1.2 --retry 3 \
    "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-GGUF/resolve/$revision/$name" --output "$temporary"
  if [[ "$(shasum -a 256 "$temporary" | awk '{print $1}')" != "$expected" ]]; then
    printf '%s\n' 'Model checksum verification failed.' >&2
    exit 1
  fi
  mv "$temporary" "$destination"
  temporary=''
}
download 'Qwen3VL-8B-Instruct-Q4_K_M.gguf' '67d1659bfe71b89d50b45a4ad1a9e5b997e5bb16ce5da66a6a6167abd569e9e2'
download 'mmproj-Qwen3VL-8B-Instruct-Q8_0.gguf' 'c6ba85508d82f42590e6eb77d5340369ab6fecf107a7561d809523d8aa5f3bfd'
printf '%s\n' 'Model profile: qwen3-vl-8b-q4km-5bcaa9cc-macos-v1'
exec llama-server --model "$model_dir/Qwen3VL-8B-Instruct-Q4_K_M.gguf" \
  --mmproj "$model_dir/mmproj-Qwen3VL-8B-Instruct-Q8_0.gguf" \
  --alias video-category-model --host "${VIDEO_MODEL_BIND_HOST:-127.0.0.1}" --port 8080 \
  --ctx-size 8192 --parallel 1 --n-gpu-layers 99 --batch-size 128 --ubatch-size 128 \
  --image-max-tokens 1024 --flash-attn on --cache-type-k q8_0 --cache-type-v q8_0 --no-webui
