/** @jest-environment node */

import { createPrismaMediaScanRunRepository } from '../media-integrity-repository';
import { MediaScanAlreadyRunningError, type MediaFinding } from '../media-integrity-scanner';

function database() {
  const tx = {
    mediaIntegrityScanRun: {
      create: jest.fn().mockResolvedValue({ id: 'scan-1' }),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    mediaIntegrityFinding: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return {
    tx,
    db: {
      mediaIntegrityScanRun: tx.mediaIntegrityScanRun,
      $transaction: jest.fn(async (callback) => callback(tx)),
    },
  };
}

const finding: MediaFinding = {
  contentId: 'movie-1',
  resourceKind: 'VIDEO',
  severity: 'CRITICAL',
  code: 'VIDEO_MISSING',
  metadata: { expectedSeconds: 60 },
};

describe('Prisma media scan run repository', () => {
  it('creates a running scan and atomically replaces findings on completion', async () => {
    const { db, tx } = database();
    const repository = createPrismaMediaScanRunRepository(db);

    await expect(repository.start({
      scope: 'CONTENT',
      requestedContentId: 'movie-1',
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
    })).resolves.toEqual({ id: 'scan-1' });
    expect(tx.mediaIntegrityScanRun.updateMany).toHaveBeenCalledWith({
      where: {
        lockKey: 'CONTENT:movie-1',
        status: 'RUNNING',
        startedAt: { lt: new Date('2026-08-14T11:30:00.000Z') },
      },
      data: { status: 'FAILED', completedAt: new Date('2026-08-14T12:00:00.000Z') },
    });
    await repository.complete('scan-1', {
      scope: 'CONTENT',
      requestedContentId: 'movie-1',
      status: 'COMPLETED',
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
      completedAt: new Date('2026-08-14T12:00:01.000Z'),
      contentCount: 1,
      findingCount: 1,
      criticalCount: 1,
      warningCount: 0,
      findings: [finding],
    });

    expect(tx.mediaIntegrityFinding.deleteMany).toHaveBeenCalledWith({ where: { scanRunId: 'scan-1' } });
    expect(tx.mediaIntegrityFinding.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ scanRunId: 'scan-1', code: 'VIDEO_MISSING' })],
    });
    expect(tx.mediaIntegrityScanRun.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'scan-1', status: 'RUNNING' },
      data: expect.objectContaining({ status: 'COMPLETED', findingCount: 1 }),
    }));
    expect(tx.mediaIntegrityFinding.deleteMany.mock.invocationCallOrder[0])
      .toBeLessThan(tx.mediaIntegrityFinding.createMany.mock.invocationCallOrder[0]);
  });

  it('marks failed runs and deletes only bounded runs beyond retention', async () => {
    const { db, tx } = database();
    tx.mediaIntegrityScanRun.findMany.mockResolvedValue([{ id: 'old-1' }, { id: 'old-2' }]);
    const repository = createPrismaMediaScanRunRepository(db, { retainedRuns: 25, cleanupBatchSize: 100 });

    await repository.fail('scan-1', new Date('2026-08-14T12:00:02.000Z'));
    await repository.complete('scan-1', {
      scope: 'CATALOG',
      requestedContentId: null,
      status: 'COMPLETED',
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
      completedAt: new Date('2026-08-14T12:00:02.000Z'),
      contentCount: 0,
      findingCount: 0,
      criticalCount: 0,
      warningCount: 0,
      findings: [],
    });

    expect(tx.mediaIntegrityScanRun.updateMany).toHaveBeenCalledWith({
      where: { id: 'scan-1', status: 'RUNNING' },
      data: { status: 'FAILED', completedAt: new Date('2026-08-14T12:00:02.000Z') },
    });
    expect(tx.mediaIntegrityScanRun.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ['COMPLETED', 'FAILED'] } },
      orderBy: { startedAt: 'desc' },
      skip: 25,
      take: 100,
    }));
    expect(tx.mediaIntegrityScanRun.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-1', 'old-2'] } },
    });
  });

  it('maps a unique running-scan lock to a stable concurrency error', async () => {
    const { db, tx } = database();
    tx.mediaIntegrityScanRun.create.mockRejectedValue(Object.assign(new Error('duplicate detail'), {
      code: 'P2002',
    }));
    const repository = createPrismaMediaScanRunRepository(db);

    await expect(repository.start({
      scope: 'CATALOG',
      requestedContentId: null,
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
    })).rejects.toEqual(new MediaScanAlreadyRunningError('CATALOG'));
  });

  it('rejects a stale worker before it can replace findings or report success', async () => {
    const { db, tx } = database();
    tx.mediaIntegrityScanRun.updateMany.mockResolvedValue({ count: 0 });
    const repository = createPrismaMediaScanRunRepository(db);

    await expect(repository.complete('superseded-scan', {
      scope: 'CATALOG',
      requestedContentId: null,
      status: 'COMPLETED',
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
      completedAt: new Date('2026-08-14T12:31:00.000Z'),
      contentCount: 1,
      findingCount: 1,
      criticalCount: 1,
      warningCount: 0,
      findings: [finding],
    })).rejects.toThrow('Media scan run was superseded by a newer owner');

    expect(tx.mediaIntegrityFinding.deleteMany).not.toHaveBeenCalled();
    expect(tx.mediaIntegrityFinding.createMany).not.toHaveBeenCalled();
  });
});
