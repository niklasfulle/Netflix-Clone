/* eslint-disable @typescript-eslint/no-require-imports -- isolated integration CLI */
const assert = require('node:assert/strict');
const { promises: fs } = require('node:fs');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const { createClient } = require('redis');
const { ensureFixture, probe } = require('./catalog-snapshot/media');
const { replaceCatalog } = require('./catalog-snapshot/database');
const { seedLocal } = require('./seed-local');
const { seedStagingCatalog } = require('./seed-staging-catalog');
const execute = promisify(execFile);

async function main() {
  if (process.env.SNAPSHOT_INTEGRATION_TEST !== 'isolated') throw new Error('Requires an isolated disposable database server.');
  const targetUrl = process.env.POSTGRESQL_URL;
  const sourceUrl = process.env.SNAPSHOT_TEST_SOURCE_URL;
  assert.equal(new URL(targetUrl).hostname, 'netflix-snapshot-test-db');
  assert.equal(new URL(sourceUrl).hostname, 'netflix-snapshot-test-db');
  assert.equal(new URL(targetUrl).pathname, '/netflix_local');
  assert.equal(new URL(sourceUrl).pathname, '/netflix_snapshot_source');
  const target = new PrismaClient();
  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const stagingUrl = new URL(targetUrl);
  stagingUrl.pathname = '/netflix_staging';
  const staging = new PrismaClient({ datasources: { db: { url: stagingUrl.toString() } } });
  const env = { ...process.env, DEPLOYMENT_ENVIRONMENT: 'local', REDIS_ENABLED: 'true', REDIS_URL: process.env.SNAPSHOT_TEST_REDIS_URL, REDIS_KEY_PREFIX: 'netflix:local:', MOVIE_FOLDER: '/snapshots/target/movies', SERIES_FOLDER: '/snapshots/target/series' };
  const sourceEnv = { ...env, POSTGRESQL_URL: sourceUrl, DEPLOYMENT_ENVIRONMENT: 'production', MOVIE_FOLDER: '/snapshots/source/movies', SERIES_FOLDER: '/snapshots/source/series' };
  const input = '/snapshots/catalog-snapshot-integration.json';
  const backup = '/snapshots/catalog-snapshot-integration-target.sql';
  const cache = createClient({ url: env.REDIS_URL });
  const report = [];
  const cli = async (args, environment) => {
    const result = await execute(process.execPath, ['scripts/catalog-snapshot.js', ...args], { env: environment, timeout: 120000 });
    report.push(result.stdout);
    return result.stdout;
  };
  try {
    for (const database of [source, target, staging]) {
      await database.movieActor.deleteMany();
      await database.movieCategory.deleteMany();
      await database.movieCategorySegment.deleteMany();
      await database.movie.deleteMany();
      await database.actor.deleteMany();
      await database.category.deleteMany();
      await database.user.deleteMany();
      await database.catalogDataState.deleteMany();
    }
    for (const file of [input, backup, '/snapshots/catalog-snapshot-second.sql', '/snapshots/catalog-snapshot-staging.sql']) {
      await fs.rm(file, { force: true });
    }
    await cache.connect();
    await cache.set('netflix:local:v1:catalog-metadata:old', 'stale');
    await cache.set('netflix:local:v1:auth:keep', 'keep');
    await cache.set('netflix:production:v1:catalog-metadata:keep', 'keep');
    const base = { title: 'Forest walk', description: 'Neutral integration fixture', genre: 'Drama', duration: '00:04', videoUrl: 'original.mp4', thumbnailUrl: '/images/hero.jpg' };
    await ensureFixture({ type: 'Movie', durationSeconds: 3.5 }, sourceEnv);
    await fs.copyFile('/snapshots/source/movies/snapshot-fixture-v1-3500.mp4', '/snapshots/source/movies/original.mp4');
    await source.movie.create({ data: { ...base, id: 'snapshot-movie', type: 'Movie', categoryReviewVersion: 2, categoryReviewedAt: new Date(), actors: { create: { actor: { create: { id: 'snapshot-actor', name: 'Avery Stone' } } } }, categories: { create: { category: { create: { id: 'snapshot-category', name: 'Wald', nameEn: 'Forest', normalizedName: 'wald', color: '#abcdef' } } } } } });
    await source.movieCategorySegment.create({ data: { id: 'snapshot-segment', movieId: 'snapshot-movie', categoryId: 'snapshot-category', startSeconds: 1, endSeconds: 3 } });
    await source.movie.create({ data: { ...base, id: 'snapshot-series', type: 'Serie', status: 'DRAFT' } });
    await fs.mkdir(sourceEnv.SERIES_FOLDER, { recursive: true });
    await fs.copyFile('/snapshots/source/movies/original.mp4', '/snapshots/source/series/original.mp4');
    await source.user.create({ data: { id: 'source-account', email: 'source@example.test', name: 'Source account' } });

    await target.movie.createMany({ data: [
      { ...base, id: 'snapshot-movie', type: 'Movie' },
      { ...base, id: 'obsolete-movie', type: 'Movie' },
    ] });
    await target.user.create({ data: { id: 'target-account', name: 'Target account', email: 'target@example.test', profil: { create: { id: 'target-profile', name: 'Target', favoriteIds: ['snapshot-movie', 'obsolete-movie'] } } } });
    await target.movieWatchTime.create({ data: { userId: 'target-account', profilId: 'target-profile', movieId: 'snapshot-movie', time: 2 } });
    await cli(['export', '--output', input], sourceEnv);
    const snapshot = JSON.parse(await fs.readFile(input, 'utf8'));
    assert.equal(snapshot.data.movies.length, 2);
    assert(!JSON.stringify(snapshot).includes('source@example.test'));
    assert(!JSON.stringify(snapshot).includes('original.mp4'));
    assert(!JSON.stringify(snapshot).includes('thumbnailUrl'));

    const preview = await cli(['import', '--input', input, '--target', 'local'], env);
    assert(JSON.parse(preview).preview);
    assert.equal(await target.movie.count({ where: { id: 'obsolete-movie' } }), 1);
    assert.equal(await fs.stat(backup).catch(() => null), null);
    await assert.rejects(cli(['import', '--input', input, '--target', 'local', '--apply'], env));
    assert.equal(await target.movie.count({ where: { id: 'obsolete-movie' } }), 1);

    await cli(['import', '--input', input, '--target', 'local', '--apply', '--confirm', 'netflix_local', '--backup', backup], env);
    assert.equal(await target.movie.count(), 2);
    assert.equal(await target.actor.count(), 1);
    assert.equal(await target.category.count(), 1);
    assert.equal(await target.movieCategorySegment.count(), 1);
    assert.equal(await cache.get('netflix:local:v1:catalog-metadata:old'), null);
    assert.equal(await cache.get('netflix:local:v1:auth:keep'), 'keep');
    assert.equal(await cache.get('netflix:production:v1:catalog-metadata:keep'), 'keep');
    assert.equal((await target.user.findMany()).length, 1);
    assert.equal(await target.user.count({ where: { id: 'source-account' } }), 0);
    assert.deepEqual((await target.profil.findUnique({ where: { id: 'target-profile' } })).favoriteIds, ['snapshot-movie']);
    assert.equal(await target.movieWatchTime.count(), 1);
    const imported = await target.movie.findUnique({ where: { id: 'snapshot-movie' } });
    assert(imported.thumbnailUrl.startsWith('data:image/png;base64,'));
    assert.equal(imported.categoryReviewVersion, 2);
    const media = await probe(`${env.MOVIE_FOLDER}/${imported.videoUrl}`, env);
    assert(media.seconds >= snapshot.data.movies.find(movie => movie.id === imported.id).durationSeconds);
    assert.equal((await target.catalogDataState.findUnique({ where: { id: 'global' } })).mode, 'production-snapshot');

    const invalidMovies = [{ ...imported, genre: null }];
    await assert.rejects(replaceCatalog(target, snapshot, invalidMovies));
    assert.equal(await target.category.count(), 1);
    assert.equal(await target.movie.count(), 2);
    await seedLocal({ db: target, environment: { ...env, AUTH_SECRET: 'isolated-test-installation', NEXT_PUBLIC_GENRE: 'Drama' } });
    assert.equal(await target.movie.count(), 2);
    assert.equal(await target.actor.count(), 1);

    // A second import reuses valid media and keeps stable IDs.
    await cli(['import', '--input', input, '--target', 'local', '--apply', '--confirm', 'netflix_local', '--backup', '/snapshots/catalog-snapshot-second.sql'], env);
    assert.equal(await target.movie.count(), 2);
    assert.equal(await target.movieCategorySegment.count(), 1);
    await cli(['import', '--input', input, '--target', 'staging', '--apply', '--confirm', 'netflix_staging', '--backup', '/snapshots/catalog-snapshot-staging.sql'], { ...env, POSTGRESQL_URL: stagingUrl.toString(), DEPLOYMENT_ENVIRONMENT: 'staging', REDIS_KEY_PREFIX: 'netflix:staging:' });
    await seedStagingCatalog({ db: staging, environment: { DEPLOYMENT_ENVIRONMENT: 'staging', NEXT_PUBLIC_GENRE: 'Drama' } });
    assert.equal(await staging.movie.count(), 2);

    const restore = new Client({ connectionString: targetUrl });
    await restore.connect();
    try { await restore.query((await fs.readFile(backup, 'utf8')).replace('\\set ON_ERROR_STOP on\n', '')); }
    finally { await restore.end(); }
    assert.equal(await target.movie.count({ where: { id: 'obsolete-movie' } }), 1);
    assert.equal(await target.category.count(), 0);
    assert.equal(await target.user.count(), 1);
    assert.deepEqual((await target.profil.findUnique({ where: { id: 'target-profile' } })).favoriteIds, ['snapshot-movie', 'obsolete-movie']);
    assert.equal(await target.catalogDataState.count(), 0);
    assert(report.every(text => !text.includes('Forest walk') && !text.includes('source@example.test')));
    console.log('PASS: read-only export, preview, local/staging import, duration-matched playback media, seed protection, rollback and SQL restoration.');
  } finally { if (cache.isOpen) await cache.quit(); await Promise.all([source.$disconnect(), target.$disconnect(), staging.$disconnect()]); }
}

main().catch(() => { console.error('Snapshot integration failed; inspect the isolated test environment.'); process.exitCode = 1; });
