/** @jest-environment node */

import {
  createJobAdministrationService,
  InvalidJobListCursorError,
  type JobAdministrationDatabase,
} from '@/lib/jobs/administration';

const admin = { userId: 'admin-user-123', role: 'ADMIN' as const };

function jobRun(id: string, acceptedAt: string) {
  return {
    id,
    jobType: 'media.integrity.scan',
    status: 'QUEUED' as const,
    progress: 0,
    progressMessage: null,
    attemptCount: 0,
    actorUserId: 'admin-user-123',
    actorRole: 'ADMIN',
    targetType: 'catalog',
    targetId: 'published',
    correlationId: `correlation-${id}`,
    errorCode: null,
    errorMessage: null,
    acceptedAt: new Date(acceptedAt),
    startedAt: null,
    completedAt: null,
    cancelRequestedAt: null,
    updatedAt: new Date(acceptedAt),
  };
}

describe('job administration', () => {
  it('returns a bounded, cursor-paginated list from PostgreSQL', async () => {
    const findMany = jest.fn().mockResolvedValue([
      jobRun('job-run-2', '2026-08-25T10:02:00.000Z'),
      jobRun('job-run-1', '2026-08-25T10:01:00.000Z'),
    ]);
    const database = { jobRun: { findMany } } as unknown as JobAdministrationDatabase;
    const service = createJobAdministrationService({ database });

    const result = await service.list(admin, {
      status: 'QUEUED',
      jobType: 'media.integrity.scan',
      limit: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'job-run-2',
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
    });
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 2,
      where: {
        jobType: 'media.integrity.scan',
        status: 'QUEUED',
      },
    }));
  });

  it('caps requests at fifty rows plus one pagination sentinel', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const database = { jobRun: { findMany } } as unknown as JobAdministrationDatabase;
    const service = createJobAdministrationService({ database });

    await service.list(admin, { limit: 500 });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 51 }));
  });

  it('rejects malformed cursors without querying PostgreSQL', async () => {
    const findMany = jest.fn();
    const database = { jobRun: { findMany } } as unknown as JobAdministrationDatabase;
    const service = createJobAdministrationService({ database });

    await expect(service.list(admin, { cursor: 'not-a-cursor' })).rejects.toBeInstanceOf(
      InvalidJobListCursorError,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('reports queue depth and a fresh worker heartbeat as healthy', async () => {
    const database = {
      jobRun: {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'QUEUED', _count: { _all: 3 } },
          { status: 'RUNNING', _count: { _all: 1 } },
          { status: 'FAILED', _count: { _all: 2 } },
        ]),
        findFirst: jest.fn().mockResolvedValue({
          acceptedAt: new Date('2026-08-25T09:59:30.000Z'),
        }),
      },
      jobWorkerHeartbeat: {
        findUnique: jest.fn().mockResolvedValue({
          state: 'ACTIVE',
          startedAt: new Date('2026-08-25T09:00:00.000Z'),
          heartbeatAt: new Date('2026-08-25T09:59:50.000Z'),
          stoppedAt: null,
        }),
      },
    } as unknown as JobAdministrationDatabase;
    const service = createJobAdministrationService({
      database,
      now: () => new Date('2026-08-25T10:00:00.000Z'),
    });

    await expect(service.health(admin)).resolves.toMatchObject({
      worker: { status: 'healthy', state: 'ACTIVE', heartbeatAgeMs: 10_000 },
      queue: { depth: 4, oldestQueuedAgeMs: 30_000 },
      counts: { QUEUED: 3, RUNNING: 1, FAILED: 2 },
    });
  });

  it('never classifies a stale heartbeat as healthy', async () => {
    const database = {
      jobRun: {
        groupBy: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      jobWorkerHeartbeat: {
        findUnique: jest.fn().mockResolvedValue({
          state: 'ACTIVE',
          startedAt: new Date('2026-08-25T09:00:00.000Z'),
          heartbeatAt: new Date('2026-08-25T09:58:00.000Z'),
          stoppedAt: null,
        }),
      },
    } as unknown as JobAdministrationDatabase;
    const service = createJobAdministrationService({
      database,
      now: () => new Date('2026-08-25T10:00:00.000Z'),
    });

    await expect(service.health(admin)).resolves.toMatchObject({
      worker: { status: 'stale', heartbeatAgeMs: 120_000 },
      queue: { depth: 0, oldestQueuedAgeMs: null },
    });
  });
});
