import { z } from 'zod';

import type { JobProgress, JobResult } from '@/lib/jobs/contracts';
import type { JobExecutionRepository } from '@/lib/jobs/worker';
import type { RedisRuntime } from '@/lib/redis/runtime';

export const JOB_COORDINATION_TTL_SECONDS = 24 * 60 * 60;

const coordinationSnapshot = z.object({
  version: z.literal(1),
  jobRunId: z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
  status: z.enum([
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'CANCEL_REQUESTED',
    'CANCELLED',
    'DEAD_LETTER',
  ]),
  progress: z.number().int().min(0).max(100).optional(),
  progressMessage: z.string().trim().min(1).max(160).optional(),
  attemptCount: z.number().int().min(0).max(100).optional(),
  result: z.union([
    z.object({
      scanRunId: z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
      contentCount: z.number().int().nonnegative().max(1_000_000),
      findingCount: z.number().int().nonnegative().max(1_000_000),
      criticalCount: z.number().int().nonnegative().max(1_000_000),
      warningCount: z.number().int().nonnegative().max(1_000_000),
    }).strict(),
    z.object({
      verificationRequestId: z.uuid(),
      status: z.literal('VERIFIED'),
      diagnosticCode: z.literal('VERIFICATION_SUCCEEDED'),
      backupName: z.string().min(6).max(191)
        .regex(/^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$/),
    }).strict(),
    z.object({
      backupRequestId: z.uuid(),
      status: z.literal('VERIFIED'),
      environment: z.enum(['staging', 'production']),
      backupName: z.string().min(6).max(191)
        .regex(/^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$/),
    }).strict(),
    z.object({
      cleanupRequestId: z.uuid(),
      status: z.literal('COMPLETED'),
      environment: z.enum(['staging', 'production']),
      retainedCount: z.number().int().nonnegative().max(1_000_000),
      removedCount: z.number().int().nonnegative().max(1_000_000),
    }).strict(),
  ]).optional(),
  errorCode: z.string().min(1).max(80).optional(),
  errorMessage: z.string().min(1).max(512).optional(),
  updatedAt: z.iso.datetime({ offset: true }),
}).strict();

export type JobCoordinationSnapshot = z.infer<typeof coordinationSnapshot>;

type JobCoordinationUpdate = Omit<JobCoordinationSnapshot, 'version' | 'jobRunId' | 'updatedAt'> & {
  updatedAt: Date;
};

export type JobCoordination = {
  publish(jobRunId: string, update: JobCoordinationUpdate): Promise<void>;
  read(jobRunId: string): Promise<JobCoordinationSnapshot | null>;
};

export function createRedisJobCoordination(
  runtime: Pick<RedisRuntime, 'key' | 'get' | 'set'>,
  options: { ttlSeconds?: number } = {},
): JobCoordination {
  const ttlSeconds = options.ttlSeconds ?? JOB_COORDINATION_TTL_SECONDS;
  const keyFor = (jobRunId: string) => runtime.key('background-job', 1, [jobRunId]);

  return {
    async publish(jobRunId, update) {
      const snapshot = coordinationSnapshot.parse({
        version: 1,
        jobRunId,
        ...update,
        updatedAt: update.updatedAt.toISOString(),
      });
      await runtime.set(keyFor(jobRunId), snapshot, { ttlSeconds });
    },
    async read(jobRunId) {
      const result = await runtime.get(keyFor(jobRunId), value => coordinationSnapshot.parse(value));
      return result.status === 'ok' ? result.value : null;
    },
  };
}

type PublishOnlyCoordination = Pick<JobCoordination, 'publish'>;

async function publishBestEffort(
  coordination: PublishOnlyCoordination,
  jobRunId: string,
  update: JobCoordinationUpdate,
): Promise<void> {
  try {
    await coordination.publish(jobRunId, update);
  } catch {
    // PostgreSQL is durable state; Redis coordination must never alter the outcome.
  }
}

export function createCoordinatedJobExecutionRepository(
  durable: JobExecutionRepository,
  coordination: PublishOnlyCoordination,
): JobExecutionRepository {
  return {
    async claim(input) {
      const claim = await durable.claim(input);
      if (claim === 'CLAIMED') {
        await publishBestEffort(coordination, input.job.jobRunId, {
          status: 'RUNNING',
          progress: 0,
          attemptCount: input.attemptCount,
          updatedAt: input.startedAt,
        });
      }
      return claim;
    },
    cancellationRequested: jobRunId => durable.cancellationRequested(jobRunId),
    async reportProgress(jobRunId: string, progress: JobProgress, updatedAt: Date) {
      await durable.reportProgress(jobRunId, progress, updatedAt);
      await publishBestEffort(coordination, jobRunId, {
        status: 'RUNNING',
        progress: progress.percent,
        progressMessage: progress.message,
        updatedAt,
      });
    },
    async succeed(jobRunId: string, result: JobResult, completedAt: Date) {
      const succeeded = await durable.succeed(jobRunId, result, completedAt);
      if (succeeded) {
        await publishBestEffort(coordination, jobRunId, {
          status: 'SUCCEEDED',
          progress: 100,
          result,
          updatedAt: completedAt,
        });
      }
      return succeeded;
    },
    async failAttempt(jobRunId, failure) {
      await durable.failAttempt(jobRunId, failure);
      await publishBestEffort(coordination, jobRunId, {
        status: failure.deadLetter ? 'DEAD_LETTER' : 'FAILED',
        attemptCount: failure.attemptCount,
        errorCode: failure.errorCode,
        errorMessage: failure.errorMessage,
        updatedAt: failure.failedAt,
      });
    },
    async cancel(jobRunId, cancelledAt) {
      await durable.cancel(jobRunId, cancelledAt);
      await publishBestEffort(coordination, jobRunId, {
        status: 'CANCELLED',
        updatedAt: cancelledAt,
      });
    },
    rejectDelivery: (queueJobId, failure) => durable.rejectDelivery(queueJobId, failure),
  };
}
