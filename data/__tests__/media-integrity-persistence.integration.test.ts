/** @jest-environment node */

import { createPrismaMediaScanRunRepository, type MediaScanDatabase } from '@/lib/administration/media-integrity-repository';
import { MediaScanAlreadyRunningError, type MediaFinding } from '@/lib/administration/media-integrity-scanner';
import { db } from '@/lib/db';
import { assertIsolatedStagingDatabase } from '@/tests/integration/database-safety';

const databaseTest = process.env.RUN_MEDIA_INTEGRITY_DATABASE_INTEGRATION === 'true'
  ? describe
  : describe.skip;

const criticalFinding: MediaFinding = {
  contentId: 'movie-integration',
  resourceKind: 'VIDEO',
  severity: 'CRITICAL',
  code: 'VIDEO_MISSING',
};

function completion(findings: MediaFinding[], time: Date) {
  return {
    scope: 'CATALOG' as const,
    requestedContentId: null,
    status: 'COMPLETED' as const,
    startedAt: time,
    completedAt: time,
    contentCount: 1,
    findingCount: findings.length,
    criticalCount: findings.filter(({ severity }) => severity === 'CRITICAL').length,
    warningCount: findings.filter(({ severity }) => severity === 'WARNING').length,
    findings,
  };
}

databaseTest('PostgreSQL media integrity persistence', () => {
  const repository = createPrismaMediaScanRunRepository(
    db as unknown as MediaScanDatabase,
    { retainedRuns: 3, cleanupBatchSize: 100 },
  );

  beforeAll(async () => {
    await assertIsolatedStagingDatabase();
    await db.mediaIntegrityScanRun.deleteMany();
  });

  afterAll(async () => {
    await db.mediaIntegrityScanRun.deleteMany().catch(() => undefined);
    await db.$disconnect();
  });

  it('persists lifecycle state and atomically replaces a run finding set', async () => {
    const startedAt = new Date('2026-08-14T12:00:00.000Z');
    const run = await repository.start({
      scope: 'CONTENT',
      requestedContentId: 'movie-integration',
      startedAt,
    });

    await expect(db.mediaIntegrityScanRun.findUnique({ where: { id: run.id } }))
      .resolves.toEqual(expect.objectContaining({ status: 'RUNNING' }));

    await repository.complete(run.id, completion([criticalFinding], startedAt));
    await repository.complete(run.id, completion([{
      ...criticalFinding,
      severity: 'WARNING',
      code: 'VIDEO_DURATION_MISMATCH',
    }], startedAt));

    await expect(db.mediaIntegrityFinding.findMany({ where: { scanRunId: run.id } }))
      .resolves.toEqual([
        expect.objectContaining({ code: 'VIDEO_DURATION_MISMATCH', severity: 'WARNING' }),
      ]);
    await expect(db.mediaIntegrityScanRun.findUnique({ where: { id: run.id } }))
      .resolves.toEqual(expect.objectContaining({ status: 'COMPLETED', findingCount: 1 }));
  });

  it('cascades findings and retains only the configured number of newest runs', async () => {
    await db.mediaIntegrityScanRun.deleteMany();
    const ids: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const time = new Date(Date.UTC(2026, 7, 14, 13, 0, index));
      const run = await repository.start({ scope: 'CATALOG', requestedContentId: null, startedAt: time });
      ids.push(run.id);
      await repository.complete(run.id, completion([criticalFinding], time));
    }

    await expect(db.mediaIntegrityScanRun.count()).resolves.toBe(3);
    await expect(db.mediaIntegrityScanRun.findMany({ orderBy: { startedAt: 'asc' }, select: { id: true } }))
      .resolves.toEqual(ids.slice(-3).map((id) => ({ id })));
    await expect(db.mediaIntegrityFinding.count()).resolves.toBe(3);
  });

  it('allows only one concurrent full-catalog scan', async () => {
    await db.mediaIntegrityScanRun.deleteMany();
    const startedAt = new Date('2026-08-14T14:00:00.000Z');

    const attempts = await Promise.allSettled([
      repository.start({ scope: 'CATALOG', requestedContentId: null, startedAt }),
      repository.start({ scope: 'CATALOG', requestedContentId: null, startedAt }),
    ]);

    const fulfilled = attempts.filter((attempt) => attempt.status === 'fulfilled');
    const rejected = attempts.filter((attempt) => attempt.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toEqual(
      new MediaScanAlreadyRunningError('CATALOG'),
    );
    await expect(db.mediaIntegrityScanRun.count({ where: { status: 'RUNNING' } })).resolves.toBe(1);
  });
});
