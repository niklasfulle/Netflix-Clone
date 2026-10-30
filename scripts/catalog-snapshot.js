/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { promises: fs } = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const { SnapshotError, validateSnapshot, assertTarget, summary } = require('./catalog-snapshot/model');
const { exportSnapshot, replaceCatalog } = require('./catalog-snapshot/database');
const { prepareMedia } = require('./catalog-snapshot/media');
const { writeTargetBackup } = require('./catalog-snapshot/backup');
const { connectCache } = require('./catalog-snapshot/cache');

const HELP = `Catalog snapshot (no accounts or original media)
  node scripts/catalog-snapshot.js export --output /snapshots/catalog-snapshot-export.json
  node scripts/catalog-snapshot.js import --input /snapshots/catalog-snapshot-export.json --target local
  node scripts/catalog-snapshot.js import --input /snapshots/catalog-snapshot-export.json --target local --apply --confirm netflix_local
Import previews by default. Stop app and worker before --apply; keep database and Redis running.
Use --backup /snapshots/catalog-snapshot-target.sql to choose the private target backup path.
Only local (netflix_local) and isolated stage/staging databases are accepted.`;

async function readSnapshot(file) {
  const handle = await fs.open(file, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 250 * 1024 * 1024) throw new SnapshotError('Snapshot file is invalid or exceeds 250 MiB.');
    return validateSnapshot(JSON.parse(await handle.readFile('utf8')));
  } catch (error) {
    if (error instanceof SnapshotError) throw error;
    throw new SnapshotError('Snapshot could not be read or is not valid JSON.');
  } finally { await handle.close(); }
}

async function run(args = process.argv.slice(2), environment = process.env, report = value => console.log(JSON.stringify(value))) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    input: { type: 'string' }, output: { type: 'string' }, target: { type: 'string' },
    backup: { type: 'string' }, confirm: { type: 'string' }, apply: { type: 'boolean', default: false }, help: { type: 'boolean' },
  } });
  if (values.help) { console.log(HELP); return; }
  const command = positionals[0];
  if (positionals.length !== 1 || !['export', 'import', 'prepare'].includes(command)) throw new SnapshotError(HELP);
  if (command === 'export' && (!values.output || values.apply)) throw new SnapshotError('Export requires --output and does not accept --apply.');
  if (command !== 'export' && !values.input) throw new SnapshotError('Import requires --input.');
  // Reject production imports before constructing any database client or reading private data.
  if (command !== 'export' && (!['local', 'staging'].includes(values.target) || environment.DEPLOYMENT_ENVIRONMENT !== values.target)) {
    throw new SnapshotError('Import requires a matching local or staging deployment environment.');
  }
  const db = new PrismaClient();
  let cache;
  let lock;
  try {
    if (command === 'export') {
      const snapshot = await exportSnapshot(db, environment);
      const serialized = `${JSON.stringify(snapshot)}\n`;
      if (Buffer.byteLength(serialized) > 250 * 1024 * 1024) throw new SnapshotError('Export exceeds the supported snapshot limit of 250 MiB.');
      await fs.mkdir(path.dirname(path.resolve(values.output)), { recursive: true, mode: 0o700 });
      await fs.writeFile(values.output, serialized, { flag: 'wx', mode: 0o600 });
      report({ exported: true, ...summary(snapshot) });
      return;
    }
    const target = await assertTarget(db, environment, values.target);
    const snapshot = await readSnapshot(values.input);
    if (snapshot.source.databaseFingerprint === target.fingerprint) throw new SnapshotError('Source and target database must be different.');
    if (!snapshot.data.movies.length) throw new SnapshotError('An empty snapshot cannot replace the target catalog.');
    report({ preview: !values.apply, target: values.target, database: target.name, existingMovies: await db.movie.count(), ...summary(snapshot) });
    if (command === 'prepare') {
      await prepareMedia(snapshot, environment, report);
      report({ mediaPrepared: true });
      return;
    }
    if (!values.apply) return;
    if (values.confirm !== target.name) throw new SnapshotError('Use --confirm with the exact target database name after reviewing the preview.');
    lock = new Client({ connectionString: environment.POSTGRESQL_URL, connectionTimeoutMillis: 10000 });
    await lock.connect();
    const { rows: [result] } = await lock.query('SELECT pg_try_advisory_lock(6401404) AS acquired');
    if (!result.acquired) throw new SnapshotError('Another catalog operation is running.');
    cache = await connectCache(environment, values.target);
    await cache?.clear();
    const backup = values.backup || path.join(path.dirname(values.input), `catalog-snapshot-target-${Date.now()}.sql`);
    await writeTargetBackup(lock, backup);
    report({ targetBackupCreated: true });
    const movies = await prepareMedia(snapshot, environment, report);
    // Keep the session lock across backup, media preparation and replacement.
    // Seed transactions use this same key and cannot race the import.
    await replaceCatalog(db, snapshot, movies);
    try { await cache?.clear(); } catch {
      throw new SnapshotError('Catalog imported, but cache clearing failed. Keep the app stopped and clear the target catalog cache before restarting.');
    }
    report({ imported: true, mode: 'production-snapshot', ...summary(snapshot) });
  } finally {
    await cache?.close();
    if (lock) await lock.end();
    await db.$disconnect();
  }
}

if (require.main === module) {
  run().catch(error => {
    const fileErrors = {
      EEXIST: 'An output, backup or fixture file already exists. Choose a new output/backup name; files are never overwritten.',
      ENOSPC: 'Insufficient space for the snapshot operation.',
      EACCES: 'Snapshot or media directories are not accessible to the current user.',
    };
    const message = Object.hasOwn(fileErrors, error?.code) ? fileErrors[error.code] : 'Catalog operation failed. Check database access, media roots, tool availability and free space; no private record values are logged.';
    console.error(error instanceof SnapshotError ? error.message : message);
    process.exitCode = 1;
  });
}

module.exports = { run, readSnapshot };
