/** @jest-environment node */

import {
  createJobRetryService,
  JobRetryNotAllowedError,
  type JobRetryDatabase,
} from '@/lib/jobs/retry';

const admin = { userId: 'admin-user-123', role: 'ADMIN' as const };

function retryCandidate(status: 'FAILED' | 'DEAD_LETTER' | 'QUEUED' | 'SUCCEEDED') {
  return {
    id: 'job-run-123',
    jobType: 'media.integrity.scan',
    contractVersion: 1,
    idempotencyKey: 'scoped-idempotency-key',
    queueJobId: 'old-queue-job-id',
    actorUserId: 'admin-user-123',
    actorRole: 'ADMIN',
    targetType: 'catalog',
    targetId: 'published',
    correlationId: 'request-correlation-123',
    status,
    payload: { scope: 'catalog' },
  };
}

function databaseWith(status: Parameters<typeof retryCandidate>[0]) {
  const record = retryCandidate(status);
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  return {
    database: {
      $transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        jobRun: {
          findUnique: jest.fn().mockResolvedValue(record),
          updateMany,
        },
        $queryRawUnsafe: jest.fn().mockResolvedValue([]),
      }),
    } as JobRetryDatabase,
    updateMany,
  };
}

describe('background job retry', () => {
  it('atomically republishes failed work with a fresh queue identifier', async () => {
    const { database, updateMany } = databaseWith('FAILED');
    const publisher = { send: jest.fn().mockResolvedValue('new-queue-job-id') };
    const service = createJobRetryService({
      database,
      publisher,
      createQueueJobId: () => 'new-queue-job-id',
      now: () => new Date('2026-08-25T10:00:00.000Z'),
    });

    await expect(service.retry('job-run-123', admin)).resolves.toMatchObject({
      id: 'job-run-123',
      queueJobId: 'new-queue-job-id',
      status: 'QUEUED',
      duplicate: false,
    });
    expect(publisher.send).toHaveBeenCalledWith(
      'media.integrity.scan',
      expect.objectContaining({
        jobRunId: 'job-run-123',
        acceptedAt: '2026-08-25T10:00:00.000Z',
      }),
      expect.objectContaining({ id: 'new-queue-job-id', retryLimit: 3 }),
    );
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'job-run-123', status: { in: ['FAILED', 'DEAD_LETTER'] } },
      data: expect.objectContaining({ status: 'QUEUED', queueJobId: 'new-queue-job-id' }),
    }));
  });

  it('treats an already queued retry as an idempotent duplicate', async () => {
    const { database, updateMany } = databaseWith('QUEUED');
    const publisher = { send: jest.fn() };
    const service = createJobRetryService({ database, publisher });

    await expect(service.retry('job-run-123', admin)).resolves.toMatchObject({
      status: 'QUEUED',
      duplicate: true,
    });
    expect(publisher.send).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('rejects retrying successful work', async () => {
    const { database } = databaseWith('SUCCEEDED');
    const service = createJobRetryService({ database, publisher: { send: jest.fn() } });

    await expect(service.retry('job-run-123', admin)).rejects.toBeInstanceOf(
      JobRetryNotAllowedError,
    );
  });
});
