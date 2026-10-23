import path from 'node:path';

import {
  createMediaFilePath,
  getMediaFolders,
  isAllowedVideoExtension,
  isSafeUploadId,
  resolveAllowedMediaPath,
} from '../media-files';

describe('media file security helpers', () => {
  it('rejects blank names and media paths before resolving their location', () => {
    expect(createMediaFilePath(process.cwd(), '  ')).toBeNull();
    expect(resolveAllowedMediaPath(' ')).toBeNull();
    expect(resolveAllowedMediaPath('file.txt')).toBeNull();
  });

  it('uses configured media roots and rejects roots or parent folders named like video files', () => {
    const parent = path.join(process.cwd(), 'parent.mp4');
    const root = path.join(parent, 'movies.mp4');
    const environment = jest.replaceProperty(process, 'env', { ...process.env, MOVIE_FOLDER: root, SERIES_FOLDER: path.join(process.cwd(), 'custom-series') });
    try {
      expect(getMediaFolders()).toEqual({ movieFolder: root, seriesFolder: path.join(process.cwd(), 'custom-series') });
      expect(resolveAllowedMediaPath(root)).toBeNull();
      expect(resolveAllowedMediaPath(parent)).toBeNull();
      expect(resolveAllowedMediaPath(path.join(root, 'film.mp4'))).toBe(path.join(root, 'film.mp4'));
    } finally { environment.restore(); }
  });
  it.each(['movie.mp4', 'movie.MOV', 'movie.webm', 'movie.mkv', 'movie.avi'])(
    'accepts supported video extension %s',
    (fileName) => {
      expect(isAllowedVideoExtension(fileName)).toBe(true);
    },
  );

  it.each(['movie.exe', 'movie.mp4.exe', 'movie', ''])(
    'rejects unsupported video extension %s',
    (fileName) => {
      expect(isAllowedVideoExtension(fileName)).toBe(false);
    },
  );

  it('creates paths only for safe file names inside the selected folder', () => {
    const folder = path.join(process.cwd(), 'movies');
    expect(createMediaFilePath(folder, 'movie.mp4')).toBe(path.join(folder, 'movie.mp4'));
    expect(createMediaFilePath(folder, '../movie.mp4')).toBeNull();
    expect(createMediaFilePath(folder, 'nested/movie.mp4')).toBeNull();
    expect(createMediaFilePath(folder, 'movie.exe')).toBeNull();
  });

  it('resolves deletions only inside configured media folders', () => {
    const moviePath = path.join(process.cwd(), 'movies', 'movie.mp4');
    const seriesPath = path.join(process.cwd(), 'series', 'series.webm');
    const outsidePath = path.join(process.cwd(), 'outside.mp4');

    expect(resolveAllowedMediaPath(moviePath)).toBe(moviePath);
    expect(resolveAllowedMediaPath(seriesPath)).toBe(seriesPath);
    expect(resolveAllowedMediaPath(outsidePath)).toBeNull();
  });

  it.each(['upload_123', 'movie-id', 'A1'])('accepts safe upload id %s', (value) => {
    expect(isSafeUploadId(value)).toBe(true);
  });

  it.each(['../upload', 'upload/name', '', 'a'.repeat(129)])(
    'rejects unsafe upload id %s',
    (value) => {
      expect(isSafeUploadId(value)).toBe(false);
    },
  );
});
