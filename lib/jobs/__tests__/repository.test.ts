/** @jest-environment node */

import { createPrismaJobExecutionRepository } from '@/lib/jobs/repository';

const queuedJob = {
  name: 'media.integrity.scan' as const,
  version: 1 as const,
  payload: { scope: 'catalog' as const },
  actor: { userId: 'admin-user-123', role: 'ADMIN' as const },
  target: { type: 'catalog' as const, id: 'published' as const },
  idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
  correlationId: 'request-correlation-123',
  jobRunId: 'job-run-123',
  acceptedAt: '2026-08-23T10:00:00.000Z',
};

function storedRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-run-123',
    queueJobId: '550e8400-e29b-41d4-a716-446655440000',
    jobType: 'media.integrity.scan',
    contractVersion: 1,
    actorUserId: 'admin-user-123',
    actorRole: 'ADMIN',
    targetType: 'catalog',
    targetId: 'published',
    correlationId: 'request-correlation-123',
    status: 'QUEUED',
    cancelRequestedAt: null,
    ...overrides,
  };
}

describe('durable job execution repository', () => {
  it('rejects a queue envelope whose ownership metadata differs from PostgreSQL', async () => {
    const database = {
      jobRun: {
        findUnique: jest.fn().mockResolvedValue(storedRun({ actorUserId: 'another-admin' })),
        updateMany: jest.fn(),
      },
    };
    const repository = createPrismaJobExecutionRepository(database);

    await expect(repository.claim({
      job: queuedJob,
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      attemptCount: 1,
      startedAt: new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toBe('REJECTED');
    expect(database.jobRun.updateMany).not.toHaveBeenCalled();
  });

  it('claims an authorized queued run with its current attempt', async () => {
    const database = {
      jobRun: {
        findUnique: jest.fn().mockResolvedValue(storedRun()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const repository = createPrismaJobExecutionRepository(database);

    await expect(repository.claim({
      job: queuedJob,
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      attemptCount: 2,
      startedAt: new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toBe('CLAIMED');
    expect(database.jobRun.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RUNNING', attemptCount: 2 }),
    }));
  });

  it('will not persist success after cancellation has been requested', async () => {
    const database = {
      jobRun: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const repository = createPrismaJobExecutionRepository(database);

    await expect(repository.succeed('job-run-123', {
      scanRunId: 'media-scan-123',
      contentCount: 4,
      findingCount: 1,
      criticalCount: 0,
      warningCount: 1,
    }, new Date('2026-08-23T10:02:00.000Z'))).resolves.toBe(false);
  });
});
