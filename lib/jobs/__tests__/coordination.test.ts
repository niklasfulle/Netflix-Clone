/** @jest-environment node */

import type { QueuedJob } from '@/lib/jobs/contracts';
import {
  createCoordinatedJobExecutionRepository,
  createRedisJobCoordination,
  JOB_COORDINATION_TTL_SECONDS,
  type JobCoordinationSnapshot,
} from '@/lib/jobs/coordination';
import type { JobExecutionRepository } from '@/lib/jobs/worker';
import type { RedisRuntime } from '@/lib/redis/runtime';

const job: QueuedJob = {
  name: 'media.integrity.scan',
  version: 1,
  payload: { scope: 'catalog' },
  actor: { userId: 'admin-user-123', role: 'ADMIN' },
  target: { type: 'catalog', id: 'published' },
  idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
  correlationId: 'request-correlation-123',
  jobRunId: 'job-run-123',
  acceptedAt: '2026-08-23T10:00:00.000Z',
};

function durableRepository(): jest.Mocked<JobExecutionRepository> {
  return {
    claim: jest.fn().mockResolvedValue('CLAIMED'),
    cancellationRequested: jest.fn().mockResolvedValue(false),
    reportProgress: jest.fn().mockResolvedValue(undefined),
    succeed: jest.fn().mockResolvedValue(true),
    failAttempt: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    rejectDelivery: jest.fn().mockResolvedValue(undefined),
  };
}

describe('background job Redis coordination', () => {
  it('stores and retrieves a bounded expiring coordination snapshot', async () => {
    let stored: unknown;
    const runtime = {
      key: jest.fn().mockReturnValue('netflix:staging:v1:background-job:test'),
      set: jest.fn().mockImplementation(async (_key, value) => {
        stored = value;
        return { status: 'ok', value: true, latencyMs: 1 };
      }),
      get: jest.fn().mockImplementation(async (_key, decode) => ({
        status: 'ok',
        value: decode(stored),
        latencyMs: 1,
      })),
    } as unknown as Pick<RedisRuntime, 'key' | 'get' | 'set'>;
    const coordination = createRedisJobCoordination(runtime);
    const updatedAt = new Date('2026-08-23T10:01:10.000Z');

    await coordination.publish(job.jobRunId, {
      status: 'RUNNING',
      progress: 25,
      progressMessage: 'Scanning catalog media',
      attemptCount: 1,
      updatedAt,
    });

    await expect(coordination.read(job.jobRunId)).resolves.toEqual({
      version: 1,
      jobRunId: job.jobRunId,
      status: 'RUNNING',
      progress: 25,
      progressMessage: 'Scanning catalog media',
      attemptCount: 1,
      updatedAt: updatedAt.toISOString(),
    });
    expect(runtime.key).toHaveBeenCalledWith('background-job', 1, [job.jobRunId]);
    expect(runtime.set).toHaveBeenCalledWith(
      'netflix:staging:v1:background-job:test',
      stored,
      { ttlSeconds: JOB_COORDINATION_TTL_SECONDS },
    );
  });

  it('uses PostgreSQL fallback when Redis has no readable coordination snapshot', async () => {
    const runtime = {
      key: jest.fn().mockReturnValue('netflix:staging:v1:background-job:test'),
      set: jest.fn(),
      get: jest.fn().mockResolvedValue({
        status: 'error',
        reason: 'unavailable',
        latencyMs: 1,
      }),
    } as unknown as Pick<RedisRuntime, 'key' | 'get' | 'set'>;

    await expect(createRedisJobCoordination(runtime).read(job.jobRunId)).resolves.toBeNull();
  });

  it('publishes lifecycle snapshots only after PostgreSQL accepts each transition', async () => {
    const durable = durableRepository();
    const coordination = { publish: jest.fn().mockResolvedValue(undefined) };
    const repository = createCoordinatedJobExecutionRepository(durable, coordination);
    const startedAt = new Date('2026-08-23T10:01:00.000Z');
    const updatedAt = new Date('2026-08-23T10:01:10.000Z');

    await expect(repository.claim({
      job,
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      attemptCount: 1,
      startedAt,
    })).resolves.toBe('CLAIMED');
    await repository.reportProgress(job.jobRunId, {
      percent: 25,
      message: 'Scanning catalog media',
    }, updatedAt);

    expect(coordination.publish).toHaveBeenNthCalledWith(1, job.jobRunId, {
      status: 'RUNNING',
      progress: 0,
      attemptCount: 1,
      updatedAt: startedAt,
    });
    expect(coordination.publish).toHaveBeenNthCalledWith(2, job.jobRunId, {
      status: 'RUNNING',
      progress: 25,
      progressMessage: 'Scanning catalog media',
      updatedAt,
    });
    expect(durable.reportProgress.mock.invocationCallOrder[0]).toBeLessThan(
      coordination.publish.mock.invocationCallOrder[1] ?? 0,
    );
  });

  it('keeps PostgreSQL outcomes successful when Redis coordination is unavailable', async () => {
    const durable = durableRepository();
    const coordination = { publish: jest.fn().mockRejectedValue(new Error('Redis unavailable')) };
    const repository = createCoordinatedJobExecutionRepository(durable, coordination);
    const completedAt = new Date('2026-08-23T10:02:00.000Z');

    await expect(repository.succeed(job.jobRunId, {
      scanRunId: 'scan-run-123',
      contentCount: 10,
      findingCount: 2,
      criticalCount: 0,
      warningCount: 2,
    }, completedAt)).resolves.toBe(true);
    expect(durable.succeed).toHaveBeenCalledTimes(1);
  });

  it('coordinates failed, dead-lettered, and cancelled durable outcomes', async () => {
    const durable = durableRepository();
    const snapshots: JobCoordinationSnapshot[] = [];
    const coordination = {
      async publish(jobRunId: string, update: Omit<JobCoordinationSnapshot, 'version' | 'jobRunId' | 'updatedAt'> & { updatedAt: Date }) {
        snapshots.push({
          version: 1,
          jobRunId,
          ...update,
          updatedAt: update.updatedAt.toISOString(),
        });
      },
    };
    const repository = createCoordinatedJobExecutionRepository(durable, coordination);
    const failedAt = new Date('2026-08-23T10:02:00.000Z');
    const cancelledAt = new Date('2026-08-23T10:03:00.000Z');

    await repository.failAttempt(job.jobRunId, {
      attemptCount: 2,
      deadLetter: false,
      errorCode: 'ScannerError',
      errorMessage: 'Scanner unavailable',
      failedAt,
    });
    await repository.failAttempt(job.jobRunId, {
      attemptCount: 3,
      deadLetter: true,
      errorCode: 'ScannerError',
      errorMessage: 'Scanner still unavailable',
      failedAt,
    });
    await repository.cancel(job.jobRunId, cancelledAt);
    await repository.rejectDelivery('queue-job-123', {
      errorCode: 'InvalidJob',
      errorMessage: 'Invalid delivery',
      failedAt,
    });
    await expect(repository.cancellationRequested(job.jobRunId)).resolves.toBe(false);

    expect(snapshots).toEqual([
      expect.objectContaining({ status: 'FAILED', attemptCount: 2 }),
      expect.objectContaining({ status: 'DEAD_LETTER', attemptCount: 3 }),
      expect.objectContaining({ status: 'CANCELLED' }),
    ]);
    expect(durable.rejectDelivery).toHaveBeenCalledWith('queue-job-123', expect.any(Object));
  });

  it('does not publish success when PostgreSQL rejects the terminal transition', async () => {
    const durable = durableRepository();
    durable.succeed.mockResolvedValue(false);
    const coordination = { publish: jest.fn() };
    const repository = createCoordinatedJobExecutionRepository(durable, coordination);

    await expect(repository.succeed(job.jobRunId, {
      scanRunId: 'scan-run-123',
      contentCount: 10,
      findingCount: 2,
      criticalCount: 0,
      warningCount: 2,
    }, new Date('2026-08-23T10:02:00.000Z'))).resolves.toBe(false);
    expect(coordination.publish).not.toHaveBeenCalled();
  });
});
