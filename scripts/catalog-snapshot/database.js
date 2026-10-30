/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { randomUUID } = require('node:crypto');
const { validateSnapshot, databaseIdentity, SnapshotError } = require('./model');
const { sourceDuration } = require('./media');

const MOVIE_FIELDS = { id: true, title: true, description: true, videoUrl: true, type: true, genre: true, duration: true, status: true, publishedAt: true, createdAt: true, updatedAt: true, categoryReviewVersion: true, categoryReviewedAt: true };
const ACTOR_FIELDS = { id: true, name: true, createdAt: true };
const CATEGORY_FIELDS = { id: true, name: true, nameEn: true, normalizedName: true, color: true, createdAt: true, updatedAt: true };

async function exportSnapshot(db, environment, duration = sourceDuration) {
  if (!['production', 'staging', 'local'].includes(environment.DEPLOYMENT_ENVIRONMENT)) {
    throw new SnapshotError('Export requires an explicit deployment environment.');
  }
  const { identity, data } = await db.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    return {
      identity: await databaseIdentity(tx),
      data: {
        movies: await tx.movie.findMany({ select: MOVIE_FIELDS, orderBy: { id: 'asc' } }),
        actors: await tx.actor.findMany({ select: ACTOR_FIELDS, orderBy: { id: 'asc' } }),
        categories: await tx.category.findMany({ select: CATEGORY_FIELDS, orderBy: { id: 'asc' } }),
        movieActors: await tx.movieActor.findMany(),
        movieCategories: await tx.movieCategory.findMany(),
        segments: await tx.movieCategorySegment.findMany(),
      },
    };
  }, { isolationLevel: 'RepeatableRead', timeout: 120000 });
  const durations = new Map();
  for (const row of data.movies) {
    const key = `${row.type}:${row.videoUrl}`;
    if (!durations.has(key)) durations.set(key, await duration(row, environment));
    row.durationSeconds = durations.get(key);
    delete row.videoUrl;
  }
  return validateSnapshot(JSON.parse(JSON.stringify({
    format: 'netflix-catalog-snapshot', version: 1, snapshotId: randomUUID(), createdAt: new Date().toISOString(),
    source: { environment: environment.DEPLOYMENT_ENVIRONMENT, databaseFingerprint: identity.fingerprint }, data,
  })));
}

async function insertMany(model, rows) {
  for (let index = 0; index < rows.length; index += 500) await model.createMany({ data: rows.slice(index, index + 500) });
}

async function replaceCatalog(db, snapshot, movies) {
  const ids = snapshot.data.movies.map(movie => movie.id);
  const retained = new Set(ids);
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe('LOCK TABLE "Movie", "Actor", "Category" IN SHARE ROW EXCLUSIVE MODE');
    await tx.movieActor.deleteMany();
    await tx.movieCategory.deleteMany();
    await tx.movieCategorySegment.deleteMany();
    await tx.actor.deleteMany();
    await tx.category.deleteMany();
    await tx.$executeRawUnsafe('DELETE FROM "Movie" WHERE NOT (id = ANY($1::text[]))', ids);
    await insertMany(tx.actor, snapshot.data.actors);
    await insertMany(tx.category, snapshot.data.categories);
    for (const movie of movies) {
      await tx.movie.upsert({ where: { id: movie.id }, create: movie, update: movie });
    }
    await insertMany(tx.movieActor, snapshot.data.movieActors);
    await insertMany(tx.movieCategory, snapshot.data.movieCategories);
    await insertMany(tx.movieCategorySegment, snapshot.data.segments);
    for (const profile of await tx.profil.findMany({ select: { id: true, favoriteIds: true } })) {
      await tx.profil.update({ where: { id: profile.id }, data: { favoriteIds: profile.favoriteIds.filter(id => retained.has(id)) } });
    }
    await tx.catalogDataState.upsert({
      where: { id: 'global' },
      create: { id: 'global', mode: 'production-snapshot', snapshotId: snapshot.snapshotId, importedAt: new Date() },
      update: { mode: 'production-snapshot', snapshotId: snapshot.snapshotId, importedAt: new Date() },
    });
  }, { isolationLevel: 'Serializable', timeout: 600000 });
}

module.exports = { exportSnapshot, replaceCatalog, insertMany };
