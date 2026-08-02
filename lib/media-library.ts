import { constants, promises as fs } from 'node:fs';
import path from 'node:path';

import { createMediaFilePath, getMediaFolders, isAllowedVideoExtension } from '@/lib/media-files';

export type MediaType = 'Movie' | 'Serie';

type MediaTypeChange = {
  currentType: MediaType;
  targetType: MediaType;
  videoUrl: string;
};

export type StagedMediaMove = {
  videoName: string;
  sourcePath: string;
  destinationPath: string;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(/* turbopackIgnore: true */ filePath);
    return true;
  } catch {
    return false;
  }
}

export function parseMediaType(value: string): MediaType {
  if (value === 'Movie' || value === 'Serie') return value;
  throw new Error(`Unsupported media type: ${value}`);
}

function folderForType(type: MediaType) {
  const { movieFolder, seriesFolder } = getMediaFolders();
  return type === 'Serie' ? seriesFolder : movieFolder;
}

async function resolveSource(folder: string, storedVideoUrl: string): Promise<string | null> {
  const baseName = path.basename(storedVideoUrl.trim());
  if (!baseName || baseName === '.' || baseName === '..') return null;

  if (isAllowedVideoExtension(baseName)) {
    const candidate = createMediaFilePath(folder, baseName);
    return candidate && await exists(candidate) ? candidate : null;
  }

  const entries = await fs.readdir(/* turbopackIgnore: true */ folder)
    .catch(() => [] as string[]);
  const matchingName = entries.find((entry) =>
    path.parse(entry).name === baseName && isAllowedVideoExtension(entry),
  );
  return matchingName ? createMediaFilePath(folder, matchingName) : null;
}

export async function stageMediaTypeChange({
  currentType,
  targetType,
  videoUrl,
}: MediaTypeChange): Promise<StagedMediaMove | null> {
  if (currentType === targetType || !videoUrl.trim()) return null;

  const sourceFolder = folderForType(currentType);
  const destinationFolder = folderForType(targetType);
  const alternateFolder = sourceFolder === getMediaFolders().movieFolder
    ? getMediaFolders().seriesFolder
    : getMediaFolders().movieFolder;
  const sourcePath = await resolveSource(sourceFolder, videoUrl)
    ?? await resolveSource(alternateFolder, videoUrl);
  if (!sourcePath) throw new Error('Video file was not found in an allowed media folder.');

  const fileName = path.basename(sourcePath);
  const destinationPath = createMediaFilePath(destinationFolder, fileName);
  if (!destinationPath) throw new Error('Video destination path is invalid.');
  if (
    path.resolve(/*turbopackIgnore: true*/ sourcePath)
    === path.resolve(/*turbopackIgnore: true*/ destinationPath)
  ) return null;
  if (await exists(destinationPath)) throw new Error('Video destination already exists.');

  await fs.mkdir(/* turbopackIgnore: true */ destinationFolder, { recursive: true });
  let staged = false;
  try {
    await fs.copyFile(
      /* turbopackIgnore: true */ sourcePath,
      /* turbopackIgnore: true */ destinationPath,
      constants.COPYFILE_EXCL,
    );
    staged = true;
    const destinationHandle = await fs.open(
      /* turbopackIgnore: true */ destinationPath,
      'r+',
    );
    try {
      await destinationHandle.sync();
    } finally {
      await destinationHandle.close();
    }
  } catch (error) {
    if (staged) {
      await fs.rm(/* turbopackIgnore: true */ destinationPath, { force: true });
    }
    throw error;
  }

  let completed = false;
  return {
    videoName: path.parse(fileName).name,
    sourcePath,
    destinationPath,
    async commit() {
      if (completed) return;
      await fs.rm(/* turbopackIgnore: true */ sourcePath);
      completed = true;
    },
    async rollback() {
      if (completed) return;
      await fs.rm(/* turbopackIgnore: true */ destinationPath, { force: true });
      completed = true;
    },
  };
}
