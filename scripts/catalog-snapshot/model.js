/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { z } = require('zod');
const { createHash } = require('node:crypto');

class SnapshotError extends Error {}
const id = z.string().min(1).max(191);
const date = z.string().datetime({ offset: true });
const movie = z.object({
  id, title: z.string().min(1).max(10000), description: z.string().max(100000),
  type: z.enum(['Movie', 'Serie']), genre: z.string().max(1000), duration: z.string().max(32),
  durationSeconds: z.number().finite().positive().max(86400),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  createdAt: date, updatedAt: date, publishedAt: date.nullable(),
  categoryReviewVersion: z.number().int().nonnegative(), categoryReviewedAt: date.nullable(),
}).strict();
const actor = z.object({ id, name: z.string().min(1).max(10000), createdAt: date }).strict();
const category = z.object({
  id, name: z.string().min(1).max(80), nameEn: z.string().max(80),
  normalizedName: z.string().min(1).max(191), color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
  createdAt: date, updatedAt: date,
}).strict();
const segment = z.object({
  id, movieId: id, categoryId: id, startSeconds: z.number().finite().nonnegative(),
  endSeconds: z.number().finite().positive(), createdAt: date,
}).strict();
const dataSchema = z.object({
  movies: z.array(movie).max(100000), actors: z.array(actor).max(100000),
  categories: z.array(category).max(100000),
  movieActors: z.array(z.object({ movieId: id, actorId: id }).strict()).max(1000000),
  movieCategories: z.array(z.object({ movieId: id, categoryId: id }).strict()).max(1000000),
  segments: z.array(segment).max(1000000),
}).strict();
const snapshotSchema = z.object({
  format: z.literal('netflix-catalog-snapshot'), version: z.literal(1),
  snapshotId: z.string().uuid(), createdAt: date,
  source: z.object({ environment: z.enum(['production', 'staging', 'local']), databaseFingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  data: dataSchema,
}).strict();

function unique(rows, key) {
  const values = new Set();
  for (const row of rows) {
    const value = key(row);
    if (values.has(value)) throw new SnapshotError('Snapshot contains duplicate identifiers or assignments.');
    values.add(value);
  }
  return values;
}

function validateSnapshot(input) {
  const parsed = snapshotSchema.safeParse(input);
  if (!parsed.success) throw new SnapshotError('Unsupported or invalid catalog snapshot.');
  const result = parsed.data;
  const { movies, actors, categories, movieActors, movieCategories, segments } = result.data;
  const movieIds = unique(movies, row => row.id);
  const actorIds = unique(actors, row => row.id);
  const categoryIds = unique(categories, row => row.id);
  unique(actors, row => row.name);
  unique(categories, row => row.normalizedName);
  unique(movieActors, row => JSON.stringify([row.movieId, row.actorId]));
  unique(movieCategories, row => JSON.stringify([row.movieId, row.categoryId]));
  unique(segments, row => row.id);
  unique(segments, row => JSON.stringify([row.movieId, row.categoryId, row.startSeconds, row.endSeconds]));
  for (const row of movieActors) {
    if (!movieIds.has(row.movieId) || !actorIds.has(row.actorId)) throw new SnapshotError('Snapshot has a broken actor assignment.');
  }
  const durations = new Map(movies.map(row => [row.id, row.durationSeconds]));
  for (const row of [...movieCategories, ...segments]) {
    if (!movieIds.has(row.movieId) || !categoryIds.has(row.categoryId)) throw new SnapshotError('Snapshot has a broken category assignment.');
  }
  for (const row of segments) {
    if (row.startSeconds >= row.endSeconds || row.endSeconds > durations.get(row.movieId)) {
      throw new SnapshotError('Snapshot category segment exceeds its video duration.');
    }
  }
  return result;
}

async function databaseIdentity(db) {
  const [row] = await db.$queryRaw`SELECT current_database() AS name, coalesce(inet_server_addr()::text, 'unix') AS address, inet_server_port() AS port`;
  return { name: row.name, fingerprint: createHash('sha256').update(JSON.stringify(row)).digest('hex') };
}

async function assertTarget(db, environment, target) {
  if (!['local', 'staging'].includes(target) || environment.DEPLOYMENT_ENVIRONMENT !== target) {
    throw new SnapshotError('Import requires a matching local or staging deployment environment.');
  }
  const identity = await databaseIdentity(db);
  const valid = target === 'local' ? identity.name === 'netflix_local' : /(?:^|[_-])stag(?:e|ing)(?:[_-]|$)/i.test(identity.name);
  if (!valid) throw new SnapshotError('Import target database name does not match the isolated environment.');
  return identity;
}

function fixtureName(durationSeconds) {
  return `snapshot-fixture-v1-${Math.ceil(durationSeconds * 1000)}.mp4`;
}

function summary(snapshot) {
  return {
    snapshotId: snapshot.snapshotId, createdAt: snapshot.createdAt,
    counts: Object.fromEntries(Object.entries(snapshot.data).map(([key, rows]) => [key, rows.length])),
    mediaFiles: new Set(snapshot.data.movies.map(row => `${row.type}:${fixtureName(row.durationSeconds)}`)).size,
    mediaSeconds: [...new Map(snapshot.data.movies.map(row => [`${row.type}:${fixtureName(row.durationSeconds)}`, row.durationSeconds])).values()].reduce((sum, value) => sum + value, 0),
  };
}

module.exports = { SnapshotError, validateSnapshot, databaseIdentity, assertTarget, fixtureName, summary };
