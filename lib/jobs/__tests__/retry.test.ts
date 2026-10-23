/** @jest-environment node */

import {
  createJobRetryService,
  JobRetryNotAllowedError,
  type JobRetryDatabase,
} from '@/lib/jobs/retry';
import { JobAccessDeniedError, JobRunNotFoundError } from '@/lib/jobs/control';
import type { QueueSendOptions } from '@/lib/jobs/submission';

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
  const findUnique = jest.fn().mockResolvedValue(record);
  const executeSql = jest.fn().mockResolvedValue([]);
  return {
    database: {
      $transaction: async (callback: (transaction: unknown) => Promise<unknown>) => callback({
        jobRun: {
          findUnique,
          updateMany,
        },
        $queryRawUnsafe: executeSql,
      }),
    } as JobRetryDatabase,
    updateMany,
    findUnique,
    executeSql,
  };
}

describe('background job retry', () => {
  it('retries through the transactional queue database with fresh runtime ids and timestamps', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T12:00:00Z'));
    try {
      const { database, executeSql } = databaseWith('FAILED');
      const publisher = { send: jest.fn(async (_name: string, _data: object, options: QueueSendOptions) => {
        await options.db.executeSql('SELECT $1', [42]);
        await options.db.executeSql('SELECT 1');
        return options.id;
      }) };
      const result = await createJobRetryService({ database, publisher }).retry('job-run-123', admin);
      expect(result.queueJobId).toMatch(/^[a-f0-9-]{36}$/);
      expect(publisher.send).toHaveBeenCalledWith('media.integrity.scan', expect.objectContaining({ acceptedAt: '2026-10-23T12:00:00.000Z' }), expect.any(Object));
      expect(executeSql.mock.calls).toEqual([['SELECT $1', 42], ['SELECT 1']]);
    } finally { jest.useRealTimers(); }
  });

  it('rejects unauthorized retries before accessing durable job state', async () => {
    const { database, findUnique } = databaseWith('FAILED');
    await expect(createJobRetryService({ database, publisher: { send: jest.fn() } }).retry('job-run-123', { userId: 'viewer', role: 'USER' })).rejects.toBeInstanceOf(JobAccessDeniedError);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('does not publish a retry for an unknown job', async () => {
    const { database, findUnique } = databaseWith('FAILED');
    findUnique.mockResolvedValueOnce(null);
    const publisher = { send: jest.fn() };
    await expect(createJobRetryService({ database, publisher }).retry('missing-job', admin)).rejects.toBeInstanceOf(JobRunNotFoundError);
    expect(publisher.send).not.toHaveBeenCalled();
  });

  it('does not mark a retry queued when the queue rejects publication', async () => {
    const { database, updateMany } = databaseWith('FAILED');
    await expect(createJobRetryService({ database, publisher: { send: jest.fn().mockResolvedValue(null) } }).retry('job-run-123', admin)).rejects.toThrow('Queue rejected the retried job');
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('rejects a retry if the durable job changed during publication', async () => {
    const { database, updateMany } = databaseWith('FAILED');
    updateMany.mockResolvedValueOnce({ count: 0 });
    const publisher = { send: jest.fn(async (_name: string, _data: object, options: QueueSendOptions) => options.id) };
    await expect(createJobRetryService({ database, publisher }).retry('job-run-123', admin)).rejects.toThrow('Background job changed while retry was queued');
  });
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
