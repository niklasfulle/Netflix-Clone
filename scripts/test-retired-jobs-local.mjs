// Requires the local database and app container. Stop jobs-worker first.
// Uses neutral job fixtures and never reads category names, images or credentials.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const retirementSql = readFileSync(new URL('../prisma/retire-video-jobs.sql', import.meta.url), 'utf8');
const check = String.raw`
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const db = new PrismaClient();
const client = new Client({ connectionString: process.env.POSTGRESQL_URL });
const ids = [];
let queueId;
async function counts() {
  return Promise.all([db.movie.count(), db.category.count(), db.movieCategory.count(),
    db.videoExample.count(), db.videoAnalysisSample.count(), db.videoEvaluationFrame.count()]);
}
(async () => {
  assert.equal(process.env.DEPLOYMENT_ENVIRONMENT, 'local');
  await client.connect();
  try {
    const before = await counts();
    for (const [jobType, status] of [
      ['video.categories.analyze', 'QUEUED'],
      ['video.examples.evaluate', 'RUNNING'],
      ['video.categories.analyze', 'SUCCEEDED'],
      ['media.integrity.scan', 'QUEUED'],
    ]) {
      const id = 'retirement-check-' + randomUUID();
      ids.push(id);
      await db.jobRun.create({ data: { id, jobType, status, contractVersion: 1,
        idempotencyKey: id, queueJobId: randomUUID(), actorUserId: 'retirement-check', actorRole: 'ADMIN',
        targetType: 'catalog', targetId: 'published', correlationId: id, payload: {} } });
    }
    const queue = await client.query('SELECT name FROM pgboss.queue WHERE name=$1', ['video.categories.analyze']);
    if (queue.rowCount) {
      queueId = randomUUID();
      await client.query('INSERT INTO pgboss.job (id, name, data) VALUES ($1, $2, $3)', [queueId, 'video.categories.analyze', '{}']);
    }
    await client.query(RETIREMENT_SQL);
    const results = await Promise.all(ids.map(id => db.jobRun.findUnique({ where: { id } })));
    assert.deepEqual(results.map(row => row.status), ['CANCELLED', 'CANCELLED', 'SUCCEEDED', 'QUEUED']);
    assert(results.slice(0, 2).every(row => row.errorCode === 'FEATURE_REMOVED'));
    if (queueId) assert.equal((await client.query('SELECT state FROM pgboss.job WHERE id=$1 AND name=$2', [queueId, 'video.categories.analyze'])).rows[0].state, 'cancelled');
    await client.query(RETIREMENT_SQL);
    assert.equal((await db.jobRun.findUnique({ where: { id: ids[0] } })).completedAt.toISOString(), results[0].completedAt.toISOString());
    assert.deepEqual(await counts(), before);
    console.log('PASS: withdrawn jobs cancelled, completed and unrelated jobs preserved, repeat is idempotent, media/categories/examples/evidence unchanged');
  } finally {
    await client.query('ROLLBACK');
    if (queueId) await client.query('DELETE FROM pgboss.job WHERE id=$1 AND name=$2', [queueId, 'video.categories.analyze']);
    await db.jobRun.deleteMany({ where: { id: { in: ids } } });
    await Promise.all([db.$disconnect(), client.end()]);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
`;

process.stdout.write(execFileSync('docker', ['compose', '--env-file', '.env.docker.local', '-f', 'compose.local.yml', 'exec', '-T', 'app', 'node', '-'], {
  input: `const RETIREMENT_SQL = ${JSON.stringify(retirementSql)};\n${check}`,
  encoding: 'utf8', timeout: 60_000, maxBuffer: 256 * 1024,
}));
