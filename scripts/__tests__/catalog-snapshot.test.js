/** @jest-environment node */
const { promises: fs } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { validateSnapshot, assertTarget, fixtureName, summary } = require('../catalog-snapshot/model');
const { exportSnapshot } = require('../catalog-snapshot/database');
const { restoreOrder } = require('../catalog-snapshot/backup');
const { run, readSnapshot } = require('../catalog-snapshot');

function fixture() {
  const date = '2026-10-30T12:00:00.000Z';
  return {
    format: 'netflix-catalog-snapshot', version: 1,
    snapshotId: '550e8400-e29b-41d4-a716-446655440000', createdAt: date,
    source: { environment: 'production', databaseFingerprint: 'a'.repeat(64) },
    data: {
      movies: [{ id: 'film', title: 'Forest', description: 'Neutral fixture', type: 'Movie', genre: 'Drama', duration: '00:20', durationSeconds: 20, status: 'PUBLISHED', publishedAt: date, createdAt: date, updatedAt: date, categoryReviewVersion: 2, categoryReviewedAt: date }],
      actors: [{ id: 'actor', name: 'Avery Stone', createdAt: date }],
      categories: [{ id: 'category', name: 'Wald', nameEn: 'Forest', normalizedName: 'wald', color: '#abcdef', createdAt: date, updatedAt: date }],
      movieActors: [{ movieId: 'film', actorId: 'actor' }],
      movieCategories: [{ movieId: 'film', categoryId: 'category' }],
      segments: [{ id: 'segment', movieId: 'film', categoryId: 'category', startSeconds: 5, endSeconds: 18, createdAt: date }],
    },
  };
}

describe('catalog snapshot boundaries', () => {
  it('keeps IDs, multilingual categories, review metadata and exact timeline positions', () => {
    const value = fixture();
    expect(validateSnapshot(value)).toEqual(value);
    expect(summary(value)).toMatchObject({ counts: { movies: 1, segments: 1 }, mediaFiles: 1, mediaSeconds: 20 });
  });

  it.each([
    value => { value.version = 99; },
    value => { value.data.users = []; },
    value => { value.data.movies[0].videoUrl = 'source.mp4'; },
    value => { value.data.actors.push({ ...value.data.actors[0], id: 'other' }); },
    value => { value.data.movies.push(value.data.movies[0]); },
    value => { value.data.categories.push({ ...value.data.categories[0], id: 'other' }); },
    value => { value.data.movieActors[0].actorId = 'missing'; },
    value => { value.data.movieCategories[0].movieId = 'missing'; },
    value => { value.data.segments[0].endSeconds = 21; },
    value => { value.data.segments[0].startSeconds = 18; },
    value => { value.data.movies[0].durationSeconds = Infinity; },
  ])('rejects incomplete, unsafe or inconsistent snapshots %#', change => {
    const value = fixture();
    change(value);
    expect(() => validateSnapshot(value)).toThrow();
  });

  it.each(['production', 'unknown', undefined])('rejects an unsafe target %s before opening a database', async target => {
    const db = { $queryRaw: jest.fn() };
    await expect(assertTarget(db, { DEPLOYMENT_ENVIRONMENT: target }, target)).rejects.toThrow('local or staging');
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it.each([
    ['local', 'netflix', false], ['local', 'netflix_local_backup', false], ['local', 'netflix_local', true],
    ['staging', 'netflix_production', false], ['staging', 'netflix_staging', true], ['staging', 'netflix-stage', true],
  ])('checks the connected database for %s / %s', async (target, name, allowed) => {
    const db = { $queryRaw: jest.fn().mockResolvedValue([{ name, address: 'test-host', port: 5432 }]) };
    const result = assertTarget(db, { DEPLOYMENT_ENVIRONMENT: target }, target);
    if (allowed) await expect(result).resolves.toMatchObject({ name });
    else await expect(result).rejects.toThrow('database name');
  });

  it('blocks a production CLI import before reading an input file or connecting', async () => {
    await expect(run(['import', '--input', 'does-not-exist.json', '--target', 'production', '--apply'], { DEPLOYMENT_ENVIRONMENT: 'production' })).rejects.toThrow('local or staging');
  });

  it('exports only the catalog allowlist and probes each distinct source video once', async () => {
    const data = fixture().data;
    const sourceMovie = { ...data.movies[0], videoUrl: 'private-original.mp4' };
    delete sourceMovie.durationSeconds;
    const tx = {
      $executeRawUnsafe: jest.fn(), $queryRaw: jest.fn().mockResolvedValue([{ name: 'source', address: 'test', port: 5432 }]),
      movie: { findMany: jest.fn().mockResolvedValue([sourceMovie, { ...sourceMovie, id: 'second-film' }]) },
      actor: { findMany: jest.fn().mockResolvedValue(data.actors) }, category: { findMany: jest.fn().mockResolvedValue(data.categories) },
      movieActor: { findMany: jest.fn().mockResolvedValue(data.movieActors) }, movieCategory: { findMany: jest.fn().mockResolvedValue(data.movieCategories) },
      movieCategorySegment: { findMany: jest.fn().mockResolvedValue(data.segments) },
    };
    const db = { $transaction: jest.fn(callback => callback(tx)) };
    const duration = jest.fn().mockResolvedValue(20);
    const exported = await exportSnapshot(db, { DEPLOYMENT_ENVIRONMENT: 'production' }, duration);
    expect(duration).toHaveBeenCalledTimes(1);
    expect(tx.$executeRawUnsafe).toHaveBeenCalledWith('SET TRANSACTION READ ONLY');
    expect(tx.movie.findMany.mock.calls[0][0].select).not.toHaveProperty('thumbnailUrl');
    expect(JSON.stringify(exported)).not.toContain('private-original.mp4');
    expect(exported.data.movies[0]).not.toHaveProperty('videoUrl');
    expect(exported.data.segments).toEqual(data.segments);
  });

  it('refuses invalid files and accepts a bounded snapshot file', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-snapshot-test-'));
    try {
      const file = path.join(directory, 'snapshot.json');
      await fs.writeFile(file, 'not json');
      await expect(readSnapshot(file)).rejects.toThrow('valid JSON');
      await fs.writeFile(file, JSON.stringify(fixture()));
      await expect(readSnapshot(file)).resolves.toEqual(fixture());
    } finally { await fs.rm(directory, { recursive: true, force: true }); }
  });

  it('pools fixtures by duration without embedding source paths or content names', () => {
    expect(fixtureName(20.1234)).toBe('snapshot-fixture-v1-20124.mp4');
    const value = fixture();
    value.data.movies.push({ ...value.data.movies[0], id: 'second' });
    expect(summary(value).mediaFiles).toBe(1);
    value.data.movies[1].type = 'Serie';
    expect(summary(value).mediaFiles).toBe(2);
  });

  it('orders target restoration by foreign keys and refuses unsupported cycles', () => {
    expect(restoreOrder(['links', 'movies', 'actors'], [{ child: 'links', parent: 'movies' }, { child: 'links', parent: 'actors' }])).toEqual(['movies', 'actors', 'links']);
    expect(() => restoreOrder(['a', 'b'], [{ child: 'a', parent: 'b' }, { child: 'b', parent: 'a' }])).toThrow('cyclic');
  });
});
