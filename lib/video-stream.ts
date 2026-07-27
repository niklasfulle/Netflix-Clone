import fs from "node:fs";
import path from "node:path";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi"];

const VIDEO_CONTENT_TYPES: Record<string, string> = {
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export interface VideoByteRange {
  start: number;
  end: number;
}

export function resolveVideoFile(
  baseFolder: string,
  storedVideoPath: string,
): string | null {
  const normalizedStoredPath = storedVideoPath.trim();
  if (!normalizedStoredPath || path.isAbsolute(normalizedStoredPath)) return null;

  const resolvedBaseFolder = path.resolve(baseFolder);
  const candidates = path.extname(normalizedStoredPath)
    ? [normalizedStoredPath]
    : [
        normalizedStoredPath,
        ...VIDEO_EXTENSIONS.map((extension) => `${normalizedStoredPath}${extension}`),
      ];

  for (const candidate of candidates) {
    const resolvedCandidate = path.resolve(resolvedBaseFolder, candidate);
    const isInsideBaseFolder =
      resolvedCandidate.startsWith(`${resolvedBaseFolder}${path.sep}`);

    if (
      isInsideBaseFolder &&
      fs.existsSync(resolvedCandidate) &&
      fs.statSync(resolvedCandidate).isFile()
    ) {
      return resolvedCandidate;
    }
  }

  return null;
}

export function getVideoContentType(videoPath: string): string {
  return VIDEO_CONTENT_TYPES[path.extname(videoPath).toLowerCase()]
    ?? "application/octet-stream";
}

export function parseVideoRange(
  rangeHeader: string,
  videoSize: number,
): VideoByteRange | null {
  if (videoSize <= 0 || rangeHeader.includes(",")) return null;

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number.parseInt(match[2], 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(0, videoSize - suffixLength),
      end: videoSize - 1,
    };
  }

  const start = Number.parseInt(match[1], 10);
  const requestedEnd = match[2]
    ? Number.parseInt(match[2], 10)
    : videoSize - 1;
  const end = Math.min(requestedEnd, videoSize - 1);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= videoSize ||
    end < start
  ) {
    return null;
  }

  return { start, end };
}
