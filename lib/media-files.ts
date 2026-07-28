import path from "node:path";

export const MAX_VIDEO_FILE_SIZE = 2 * 1024 * 1024 * 1024;
export const MAX_VIDEO_CHUNK_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_CHUNKS = Math.ceil(
  MAX_VIDEO_FILE_SIZE / MAX_VIDEO_CHUNK_SIZE,
);

const VIDEO_EXTENSIONS = new Set([".avi", ".mkv", ".mov", ".mp4", ".webm"]);
const SAFE_UPLOAD_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export function getMediaFolders() {
  return {
    movieFolder: path.resolve(process.env.MOVIE_FOLDER || "./movies"),
    seriesFolder: path.resolve(process.env.SERIES_FOLDER || "./series"),
  };
}

export function isAllowedVideoExtension(fileName: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function isSafeUploadId(value: string): boolean {
  return SAFE_UPLOAD_ID.test(value);
}

function isPathInside(folder: string, candidate: string): boolean {
  const relativePath = path.relative(folder, candidate);
  return (
    relativePath !== ""
    && !relativePath.startsWith(`..${path.sep}`)
    && relativePath !== ".."
    && !path.isAbsolute(relativePath)
  );
}

export function createMediaFilePath(
  folder: string,
  fileName: string,
): string | null {
  const trimmedName = fileName.trim();
  if (
    !trimmedName
    || path.basename(trimmedName) !== trimmedName
    || !isAllowedVideoExtension(trimmedName)
  ) {
    return null;
  }

  const resolvedFolder = path.resolve(folder);
  const resolvedFile = path.resolve(resolvedFolder, trimmedName);
  return isPathInside(resolvedFolder, resolvedFile) ? resolvedFile : null;
}

export function resolveAllowedMediaPath(inputPath: string): string | null {
  if (!inputPath.trim() || !isAllowedVideoExtension(inputPath)) return null;

  const candidate = path.resolve(inputPath);
  const { movieFolder, seriesFolder } = getMediaFolders();
  return [movieFolder, seriesFolder].some((folder) => isPathInside(folder, candidate))
    ? candidate
    : null;
}
