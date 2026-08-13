#!/bin/sh
set -eu

media_image="${STAGING_MEDIA_IMAGE:?STAGING_MEDIA_IMAGE is required}"
movie_file="staging-player-movie.mp4"
series_file="staging-player-series.mp4"
movie_temp="/movies/.staging-player-movie.tmp.mp4"
series_temp="/series/.staging-player-series.tmp.mp4"

cleanup() {
  rm -f "$movie_temp" "$series_temp"
}
trap cleanup EXIT INT TERM

probe_media() {
  folder="$1"
  file_name="$2"
  video_codec="$(docker run --rm \
    --volume "$folder:/media:ro" \
    --entrypoint ffprobe \
    "$media_image" \
    -v error -select_streams v:0 -show_entries stream=codec_name \
    -of default=noprint_wrappers=1:nokey=1 "/media/$file_name")"
  audio_codec="$(docker run --rm \
    --volume "$folder:/media:ro" \
    --entrypoint ffprobe \
    "$media_image" \
    -v error -select_streams a:0 -show_entries stream=codec_name \
    -of default=noprint_wrappers=1:nokey=1 "/media/$file_name")"
  duration="$(docker run --rm \
    --volume "$folder:/media:ro" \
    --entrypoint ffprobe \
    "$media_image" \
    -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "/media/$file_name")"
  duration_seconds="${duration%%.*}"

  case "$duration_seconds" in
    ''|*[!0-9]*) return 1 ;;
  esac

  [ "$video_codec" = "h264" ] \
    && [ "$audio_codec" = "aac" ] \
    && [ "$duration_seconds" -ge 9 ]
}

generate_media() {
  folder="$1"
  file_name="$2"
  frequency="$3"
  target="$folder/$file_name"
  temp_file="$folder/.${file_name%.mp4}.tmp.mp4"

  if [ -s "$target" ] && probe_media "$folder" "$file_name"; then
    return
  fi

  rm -f "$temp_file"
  docker run --rm \
    --user 10001:10001 \
    --volume "$folder:/media" \
    "$media_image" \
    -y \
    -f lavfi -i "testsrc2=size=426x240:rate=20" \
    -f lavfi -i "sine=frequency=$frequency:sample_rate=44100" \
    -t 10 \
    -c:v libx264 -preset veryfast -crf 35 -g 40 -keyint_min 40 \
    -pix_fmt yuv420p \
    -c:a aac -b:a 32k \
    -movflags +faststart \
    "/media/$(basename "$temp_file")"

  probe_media "$folder" "$(basename "$temp_file")"
  mv -f "$temp_file" "$target"
}

generate_media /movies "$movie_file" 660
generate_media /series "$series_file" 880

printf '%s\n' "Staging H.264/AAC test media is ready"
