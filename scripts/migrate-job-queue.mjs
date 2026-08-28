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
  const queueDefinitions = [
    {
      name: 'media.integrity.scan',
      deadLetter: 'media.integrity.scan.dead',
    },
    {
      name: 'backup.verification.request',
      deadLetter: 'backup.verification.request.dead',
    },
    {
      name: 'backup.creation.request',
      deadLetter: 'backup.creation.request.dead',
      expireInSeconds: 30 * 60,
    },
    {
      name: 'backup.retention.cleanup',
      deadLetter: 'backup.retention.cleanup.dead',
    },
    {
      name: 'weekly.schedule.tick',
      deadLetter: 'weekly.schedule.tick.dead',
    },
  ];

  for (const definition of queueDefinitions) {
    if (!await boss.getQueue(definition.deadLetter)) {
      await boss.createQueue(definition.deadLetter, {
        retentionSeconds: 30 * 24 * 60 * 60,
        deleteAfterSeconds: 30 * 24 * 60 * 60,
      });
    }

    const queueOptions = {
      retryLimit: 3,
      retryDelay: 5,
      retryBackoff: true,
      retryDelayMax: 60,
      expireInSeconds: definition.expireInSeconds ?? 15 * 60,
      retentionSeconds: 24 * 60 * 60,
      deleteAfterSeconds: 7 * 24 * 60 * 60,
      heartbeatSeconds: 30,
      deadLetter: definition.deadLetter,
    };
    if (await boss.getQueue(definition.name)) {
      await boss.updateQueue(definition.name, queueOptions);
    } else {
      await boss.createQueue(definition.name, queueOptions);
    }
  }
} finally {
  await boss.stop({ graceful: true, timeout: 30_000 });
}
