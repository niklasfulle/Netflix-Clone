/** @jest-environment node */

import {
  createJobControlService,
  JobAccessDeniedError,
  type JobControlDatabase,
  type JobRunStatusView,
} from '@/lib/jobs/control';

function storedJob(status: JobRunStatusView['status']): JobRunStatusView {
  return {
    id: 'job-run-123',
    jobType: 'media.integrity.scan',
    queueJobId: '550e8400-e29b-41d4-a716-446655440000',
    status,
    progress: status === 'RUNNING' ? 20 : 0,
    progressMessage: null,
    attemptCount: status === 'RUNNING' ? 1 : 0,
    result: null,
    errorCode: null,
    errorMessage: null,
    correlationId: 'request-correlation-123',
    acceptedAt: new Date('2026-08-23T10:00:00.000Z'),
    startedAt: status === 'RUNNING' ? new Date('2026-08-23T10:01:00.000Z') : null,
    completedAt: null,
    cancelRequestedAt: null,
  };
}

function transactionalDatabase(status: JobRunStatusView['status']) {
  let committed = storedJob(status);
  const operations = (read: () => typeof committed, write: (value: typeof committed) => void) => ({
    findUnique: jest.fn(async () => ({ ...read() })),
    updateMany: jest.fn(async ({ where, data }: { where: { status?: string | { in: string[] } }; data: Record<string, unknown> }) => {
      const current = read();
      const allowed = typeof where.status === 'string'
        ? current.status === where.status
        : !where.status || where.status.in.includes(current.status);
      if (!allowed) return { count: 0 };
      write({ ...current, ...data });
      return { count: 1 };
    }),
  });
  const database: JobControlDatabase = {
    jobRun: operations(() => committed, (value) => { committed = value; }),
    async $transaction(callback) {
      let pending = { ...committed };
      const transaction = {
        jobRun: operations(() => pending, (value) => { pending = value; }),
        async $queryRawUnsafe<R>() { return [] as R; },
      };
      const result = await callback(transaction);
      committed = pending;
      return result;
    },
  };
  return { database, current: () => committed };
}

const admin = { userId: 'admin-user-123', role: 'ADMIN' as const };

describe('background job control', () => {
  it('atomically cancels queued work in PostgreSQL and the queue', async () => {
    const { database, current } = transactionalDatabase('QUEUED');
    const queue = { cancel: jest.fn().mockResolvedValue({ affected: 1 }) };
    const service = createJobControlService({
      database,
      queue,
      now: () => new Date('2026-08-23T10:02:00.000Z'),
    });

    await expect(service.cancel('job-run-123', admin)).resolves.toMatchObject({
      id: 'job-run-123',
      status: 'CANCELLED',
    });
    expect(current().status).toBe('CANCELLED');
  });

  it('requests cooperative cancellation for running work', async () => {
    const { database, current } = transactionalDatabase('RUNNING');
    const queue = { cancel: jest.fn() };
    const service = createJobControlService({
      database,
      queue,
      now: () => new Date('2026-08-23T10:02:00.000Z'),
    });

    await expect(service.cancel('job-run-123', admin)).resolves.toMatchObject({
      status: 'CANCEL_REQUESTED',
    });
    expect(current().status).toBe('CANCEL_REQUESTED');
    expect(queue.cancel).not.toHaveBeenCalled();
  });

  it('rolls back queued cancellation if the queue cannot be updated', async () => {
    const { database, current } = transactionalDatabase('QUEUED');
    const service = createJobControlService({
      database,
      queue: { cancel: jest.fn().mockRejectedValue(new Error('queue unavailable')) },
      now: () => new Date('2026-08-23T10:02:00.000Z'),
    });

    await expect(service.cancel('job-run-123', admin)).rejects.toThrow('queue unavailable');
    expect(current().status).toBe('QUEUED');
  });

  it('rejects job status access without administrator authorization', async () => {
    const { database } = transactionalDatabase('QUEUED');
    const service = createJobControlService({ database, queue: { cancel: jest.fn() } });

    await expect(service.get('job-run-123', {
      userId: 'regular-user-123',
      role: 'USER',
    })).rejects.toBeInstanceOf(JobAccessDeniedError);
  });
});
