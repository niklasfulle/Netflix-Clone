import { PgBoss } from 'pg-boss';

const connectionString = process.env.POSTGRESQL_URL;
if (!connectionString) throw new Error('POSTGRESQL_URL is required for job queue migration');

const boss = new PgBoss({
  connectionString,
  schema: 'pgboss',
  migrate: true,
  createSchema: true,
  schedule: false,
  supervise: false,
});

await boss.start();
try {
  if (!await boss.getQueue('media.integrity.scan.dead')) {
    await boss.createQueue('media.integrity.scan.dead', {
      retentionSeconds: 30 * 24 * 60 * 60,
      deleteAfterSeconds: 30 * 24 * 60 * 60,
    });
  }

  const queueOptions = {
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
    retryDelayMax: 60,
    expireInSeconds: 15 * 60,
    retentionSeconds: 24 * 60 * 60,
    deleteAfterSeconds: 7 * 24 * 60 * 60,
    heartbeatSeconds: 30,
    deadLetter: 'media.integrity.scan.dead',
  };
  if (await boss.getQueue('media.integrity.scan')) {
    await boss.updateQueue('media.integrity.scan', queueOptions);
  } else {
    await boss.createQueue('media.integrity.scan', queueOptions);
  }
} finally {
  await boss.stop({ graceful: true, timeout: 30_000 });
}
