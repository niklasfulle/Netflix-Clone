/** @jest-environment node */

import { createJobSubmissionService, jobQueueOptions, type JobSubmissionDatabase } from '@/lib/jobs/submission';

type StoredJob = {
  id: string;
  jobType: string;
  idempotencyKey: string;
  queueJobId: string | null;
  status: string;
  correlationId: string;
};

function submission() {
  return {
    name: 'media.integrity.scan' as const,
    version: 1 as const,
    payload: { scope: 'catalog' as const },
    actor: { userId: 'admin-user-123', role: 'ADMIN' as const },
    target: { type: 'catalog' as const, id: 'published' as const },
    idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
    correlationId: 'request-correlation-123',
  };
}

function backupVerificationSubmission() {
  return {
    name: 'backup.verification.request' as const,
    version: 1 as const,
    payload: {
      scope: 'latest' as const,
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      requestedAt: '2026-08-23T10:00:00.000Z',
    },
    actor: { userId: 'admin-user-123', role: 'ADMIN' as const },
    target: { type: 'backup' as const, id: 'latest' as const },
    idempotencyKey: 'backup-verify-request-123',
    correlationId: 'request-correlation-123',
  };
}

function backupRetentionSubmission() {
  return {
    name: 'backup.retention.cleanup' as const,
    version: 1 as const,
    payload: {
      scope: 'scheduled' as const,
      environment: 'staging' as const,
      requestId: '750e8400-e29b-41d4-a716-446655440000',
      requestedAt: '2026-08-23T10:00:00.000Z',
    },
    actor: { userId: 'admin-user-123', role: 'ADMIN' as const },
    target: { type: 'backup_retention' as const, id: 'staging' as const },
    idempotencyKey: 'backup-retention-request-123',
    correlationId: 'request-correlation-123',
  };
}

function transactionalDatabase() {
  const committed = new Map<string, StoredJob>();
  const database: JobSubmissionDatabase = {
    jobRun: {
      findUnique: jest.fn(async ({ where }: { where: { jobType_idempotencyKey: { jobType: string; idempotencyKey: string } } }) => {
        const key = `${where.jobType_idempotencyKey.jobType}:${where.jobType_idempotencyKey.idempotencyKey}`;
        return committed.get(key) ?? null;
      }),
    },
    async $transaction(callback) {
      const pending = new Map(committed);
      const transaction = {
        jobRun: {
          findUnique: async ({ where }: { where: { jobType_idempotencyKey: { jobType: string; idempotencyKey: string } } }) => {
            const key = `${where.jobType_idempotencyKey.jobType}:${where.jobType_idempotencyKey.idempotencyKey}`;
            return pending.get(key) ?? null;
          },
          create: async ({ data }: { data: Omit<StoredJob, 'id'> & { payload: unknown; contractVersion: number; actorUserId: string; actorRole: string; targetType: string; targetId: string; acceptedAt: Date } }) => {
            const record = { ...data, id: 'job-run-1' };
            pending.set(`${data.jobType}:${data.idempotencyKey}`, record);
            return record;
          },
        },
        async $queryRawUnsafe<T>() {
          return [] as T;
        },
      };
      const result = await callback(transaction);
      committed.clear();
      for (const [key, value] of pending) committed.set(key, value);
      return result;
    },
  };
  return { database, committed };
}

describe('background job submission', () => {
  it('gives backup creation its longer timeout and dedicated dead-letter queue', () => {
    expect(jobQueueOptions({ jobName: 'backup.creation.request', queueJobId: 'queue-1', singletonKey: 'backup-1', database: { executeSql: jest.fn() } })).toMatchObject({ expireInSeconds: 1800, deadLetter: 'backup.creation.request.dead' });
  });
  it('uses runtime identifiers and executes queue SQL in the accepting transaction', async () => {
    const { database, committed } = transactionalDatabase();
    const service = createJobSubmissionService({ database, publisher: {
      send: jest.fn(async (_name, _data, options) => {
        await expect(options.db.executeSql('SELECT 1')).resolves.toEqual({ rows: [] });
        await expect(options.db.executeSql('SELECT $1', [1])).resolves.toEqual({ rows: [] });
        return options.id;
      }),
    } });
    const result = await service.submit(submission());
    expect(result.queueJobId).toMatch(/^[0-9a-f-]{36}$/);
    expect(committed.size).toBe(1);
  });

  it('rolls back when the queue refuses to accept a job', async () => {
    const { database, committed } = transactionalDatabase();
    const service = createJobSubmissionService({ database, publisher: { send: jest.fn().mockResolvedValue(null) } });
    await expect(service.submit(submission())).rejects.toThrow('Queue rejected the accepted job');
    expect(committed.size).toBe(0);
  });

  it('rejects a corrupt existing run without a queue identifier', async () => {
    const { database } = transactionalDatabase();
    jest.mocked(database.jobRun.findUnique).mockResolvedValueOnce({ id: 'broken-run', queueJobId: null, status: 'QUEUED', correlationId: 'request-1' });
    const send = jest.fn();
    await expect(createJobSubmissionService({ database, publisher: { send } }).submit(submission())).rejects.toThrow('missing its queue identifier');
    expect(send).not.toHaveBeenCalled();
  });

  it('preserves a uniqueness failure when no winning job can be found', async () => {
    const { database } = transactionalDatabase();
    const conflict = Object.assign(new Error('unique conflict'), { code: 'P2002' });
    database.$transaction = jest.fn().mockRejectedValue(conflict);
    await expect(createJobSubmissionService({ database, publisher: { send: jest.fn() } }).submit(submission())).rejects.toBe(conflict);
  });

  it('returns a duplicate discovered inside the accepting transaction without publishing', async () => {
    const { database } = transactionalDatabase();
    const send = jest.fn(async (_name, _data, options) => options.id);
    const service = createJobSubmissionService({ database, publisher: { send } });
    await service.submit(submission());
    jest.mocked(database.jobRun.findUnique).mockResolvedValueOnce(null);
    await expect(service.submit(submission())).resolves.toMatchObject({ duplicate: true });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('atomically persists and enqueues an accepted typed job', async () => {
    const { database, committed } = transactionalDatabase();
    const publisher = { send: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440000') };
    const service = createJobSubmissionService({
      database,
      publisher,
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(service.submit(submission())).resolves.toEqual({
      id: 'job-run-1',
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'QUEUED',
      duplicate: false,
      correlationId: 'request-correlation-123',
    });
    expect(committed.size).toBe(1);
  });

  it('publishes backup verification failures to their dedicated dead-letter queue', async () => {
    const { database } = transactionalDatabase();
    const publisher = {
      send: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440000'),
    };
    const service = createJobSubmissionService({
      database,
      publisher,
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    await service.submit(backupVerificationSubmission());

    expect(publisher.send).toHaveBeenCalledWith(
      'backup.verification.request',
      expect.any(Object),
      expect.objectContaining({ deadLetter: 'backup.verification.request.dead' }),
    );
  });

  it('publishes backup retention failures to their dedicated dead-letter queue', async () => {
    const { database } = transactionalDatabase();
    const publisher = {
      send: jest.fn().mockResolvedValue('850e8400-e29b-41d4-a716-446655440000'),
    };
    const service = createJobSubmissionService({
      database,
      publisher,
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => '850e8400-e29b-41d4-a716-446655440000',
    });

    await service.submit(backupRetentionSubmission());

    expect(publisher.send).toHaveBeenCalledWith(
      'backup.retention.cleanup',
      expect.any(Object),
      expect.objectContaining({ deadLetter: 'backup.retention.cleanup.dead' }),
    );
  });

  it('rolls back the durable job when queue publication fails', async () => {
    const { database, committed } = transactionalDatabase();
    const service = createJobSubmissionService({
      database,
      publisher: { send: jest.fn().mockRejectedValue(new Error('queue unavailable')) },
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(service.submit(submission())).rejects.toThrow('queue unavailable');
    expect(committed.size).toBe(0);
  });

  it('returns the existing run for duplicate delivery without enqueuing again', async () => {
    const { database } = transactionalDatabase();
    const publisher = { send: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440000') };
    const service = createJobSubmissionService({
      database,
      publisher,
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    await service.submit(submission());
    await expect(service.submit(submission())).resolves.toMatchObject({
      id: 'job-run-1',
      duplicate: true,
    });
    expect(publisher.send).toHaveBeenCalledTimes(1);
  });

  it('scopes a client idempotency key to the authenticated actor and stable target', async () => {
    const { database, committed } = transactionalDatabase();
    let queueSequence = 0;
    const publisher = {
      send: jest.fn(async (_name, _data, options) => options.id),
    };
    const service = createJobSubmissionService({
      database,
      publisher,
      now: () => new Date('2026-08-23T10:00:00.000Z'),
      createQueueJobId: () => `550e8400-e29b-41d4-a716-44665544000${queueSequence++}`,
    });
    const catalog = submission();
    const content = {
      ...submission(),
      payload: { scope: 'content' as const, contentId: 'movie-1' },
      target: { type: 'content' as const, id: 'movie-1' },
    };
    const secondActor = {
      ...submission(),
      actor: { userId: 'second-admin-123', role: 'ADMIN' as const },
    };

    await expect(service.submit(catalog)).resolves.toMatchObject({ duplicate: false });
    await expect(service.submit(content)).resolves.toMatchObject({ duplicate: false });
    await expect(service.submit(secondActor)).resolves.toMatchObject({ duplicate: false });

    expect(committed.size).toBe(3);
    expect(publisher.send).toHaveBeenCalledTimes(3);
  });

  it('returns the winning run when concurrent submissions collide on idempotency', async () => {
    const winner = {
      id: 'job-run-winner',
      queueJobId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'QUEUED',
      correlationId: 'request-correlation-123',
    };
    const findUnique = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    const database: JobSubmissionDatabase = {
      jobRun: { findUnique },
      $transaction: jest.fn().mockRejectedValue(Object.assign(new Error('unique conflict'), { code: 'P2002' })),
    };
    const service = createJobSubmissionService({
      database,
      publisher: { send: jest.fn() },
    });

    await expect(service.submit(submission())).resolves.toEqual({
      ...winner,
      duplicate: true,
    });
  });
});
