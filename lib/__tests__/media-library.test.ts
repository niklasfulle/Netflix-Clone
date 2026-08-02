/** @jest-environment node */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parseMediaType, stageMediaTypeChange } from '@/lib/media-library';

describe('parseMediaType', () => {
  it.each(['Movie', 'Serie'] as const)('accepts the supported media type %s', (type) => {
    expect(parseMediaType(type)).toBe(type);
  });

  it('rejects an unknown persisted media type', () => {
    expect(() => parseMediaType('Documentary')).toThrow('Unsupported media type');
  });
});

describe('stageMediaTypeChange', () => {
  let root: string;
  let movies: string;
  let series: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'netflix-media-'));
    movies = path.join(root, 'movies');
    series = path.join(root, 'series');
    await fs.mkdir(movies);
    await fs.mkdir(series);
    process.env.MOVIE_FOLDER = movies;
    process.env.SERIES_FOLDER = series;
  });

  afterEach(async () => {
    delete process.env.MOVIE_FOLDER;
    delete process.env.SERIES_FOLDER;
    await fs.rm(root, { recursive: true, force: true });
  });

  it('keeps the source until commit and rolls the staged copy back safely', async () => {
    const source = path.join(movies, 'video.mp4');
    const destination = path.join(series, 'video.mp4');
    await fs.writeFile(source, 'video');

    const staged = await stageMediaTypeChange({
      currentType: 'Movie',
      targetType: 'Serie',
      videoUrl: 'video.mp4',
    });

    expect(staged?.videoName).toBe('video');
    await expect(fs.readFile(source, 'utf8')).resolves.toBe('video');
    await expect(fs.readFile(destination, 'utf8')).resolves.toBe('video');

    await staged?.rollback();
    await expect(fs.access(destination)).rejects.toThrow();
    await expect(fs.readFile(source, 'utf8')).resolves.toBe('video');
  });

  it('deletes the original only after the destination is durable and commit is requested', async () => {
    const source = path.join(movies, 'video.mp4');
    const destination = path.join(series, 'video.mp4');
    await fs.writeFile(source, 'video');

    const staged = await stageMediaTypeChange({
      currentType: 'Movie',
      targetType: 'Serie',
      videoUrl: 'video.mp4',
    });
    await staged?.commit();

    await expect(fs.access(source)).rejects.toThrow();
    await expect(fs.readFile(destination, 'utf8')).resolves.toBe('video');
  });

  it('rejects destination collisions without overwriting either file', async () => {
    await fs.writeFile(path.join(movies, 'video.mp4'), 'source');
    await fs.writeFile(path.join(series, 'video.mp4'), 'existing');

    await expect(stageMediaTypeChange({
      currentType: 'Movie',
      targetType: 'Serie',
      videoUrl: 'video.mp4',
    })).rejects.toThrow('already exists');

    await expect(fs.readFile(path.join(movies, 'video.mp4'), 'utf8')).resolves.toBe('source');
    await expect(fs.readFile(path.join(series, 'video.mp4'), 'utf8')).resolves.toBe('existing');
  });

  it('resolves a stored extensionless video name inside the configured source folder', async () => {
    await fs.writeFile(path.join(movies, 'video.mkv'), 'video');

    const staged = await stageMediaTypeChange({
      currentType: 'Movie',
      targetType: 'Serie',
      videoUrl: 'video',
    });

    expect(staged?.videoName).toBe('video');
    await staged?.rollback();
  });
});
