import { PgBoss } from 'pg-boss';
import { z } from 'zod';

import { mediaIntegrityScanner } from '@/lib/media-integrity';
import { db } from '@/lib/db';
import {
  readBackupVerificationStatus,
  requestBackupVerification,
} from '@/lib/backup-verification';
import {
  readBackupRetentionStatus,
  requestBackupRetention,
} from '@/lib/backup-retention';
import { createBackupRetentionJobHandler } from '@/lib/jobs/backup-retention-job';
import { createBackupVerificationJobHandler } from '@/lib/jobs/backup-verification-job';
import {
  createCoordinatedJobExecutionRepository,
  createRedisJobCoordination,
} from '@/lib/jobs/coordination';
import { JOB_NAMES, type QueuedJob } from '@/lib/jobs/contracts';
import { createPrismaJobExecutionRepository } from '@/lib/jobs/repository';
import { executeQueuedJob, PermanentJobError } from '@/lib/jobs/worker';
import { createWorkerLifecycle } from '@/lib/jobs/worker-lifecycle';
import { createOperationalLeaseCoordinator } from '@/lib/operations/lease';
import { createPostgresOperationalLeaseStore } from '@/lib/operations/postgres-lease-store';
import { getRedisRuntime } from '@/lib/redis/runtime';

function databaseUrl(): string {
  const value = process.env.POSTGRESQL_URL;
  if (!value) throw new Error('POSTGRESQL_URL is required by the background worker');
  return value;
}

function failureDetails(error: unknown) {
  return {
    errorCode: (error instanceof Error ? error.name : 'InvalidJob').slice(0, 80),
    errorMessage: (error instanceof Error ? error.message : 'Invalid job delivery').slice(0, 512),
    failedAt: new Date(),
  };
}

function isPermanent(error: unknown): boolean {
  return error instanceof PermanentJobError || error instanceof z.ZodError
    || (error instanceof Error && ['Job envelope is stale', 'Job envelope exceeds the allowed size'].includes(error.message));
}

const boss = new PgBoss({
  connectionString: databaseUrl(),
  schema: 'pgboss',
  migrate: false,
  createSchema: false,
  schedule: false,
  supervise: true,
});
const redis = getRedisRuntime();
const runs = createCoordinatedJobExecutionRepository(
  createPrismaJobExecutionRepository(db),
  createRedisJobCoordination(redis),
);
const operationalLeases = createOperationalLeaseCoordinator({
  store: createPostgresOperationalLeaseStore(db),
});
const backupVerificationJob = createBackupVerificationJobHandler({
  submitRequest: requestBackupVerification,
  readStatus: readBackupVerificationStatus,
});
const backupRetentionJob = createBackupRetentionJobHandler({
  submitRequest: requestBackupRetention,
  readStatus: readBackupRetentionStatus,
});

boss.on('error', (error) => {
  console.error('background_worker_error', error);
});

const workOptions = {
  includeMetadata: true,
  perJobResults: true,
  batchSize: 1,
  localConcurrency: 1,
} as const;

type WorkerDelivery = {
  id: string;
  data: QueuedJob;
  retryCount: number;
  retryLimit: number;
  signal?: AbortSignal;
};

async function processJobs(jobs: WorkerDelivery[]) {
  return Promise.all(jobs.map(async (job) => {
  try {
    const outcome = await executeQueuedJob({
      envelope: job.data,
      queue: {
        id: job.id,
        retryCount: job.retryCount,
        retryLimit: job.retryLimit,
        signal: job.signal,
      },
      runs,
      handlers: {
        async mediaIntegrityScan(payload, { reportProgress }) {
          return operationalLeases.execute({
            operation: 'media.scan',
            targetId: payload.scope === 'content'
              ? `content:${payload.contentId}`
              : 'catalog:published',
            ttlMs: 15 * 60_000,
          }, async () => {
            await reportProgress({ percent: 5, message: 'Scanning catalog media' });
            const result = await mediaIntegrityScanner.scan(
              payload.scope === 'content' ? { contentId: payload.contentId } : {},
            );
            await reportProgress({ percent: 95, message: 'Persisting scan result' });
            return {
              scanRunId: result.id,
              contentCount: result.contentCount,
              findingCount: result.findingCount,
              criticalCount: result.criticalCount,
              warningCount: result.warningCount,
            };
          });
        },
        async backupVerification(payload, context) {
          return operationalLeases.execute({
            operation: 'backup.verify',
            targetId: 'backup-verification:latest',
            ttlMs: 15 * 60_000,
          }, async () => backupVerificationJob(payload, context));
        },
        async backupRetention(payload, context) {
          return operationalLeases.execute({
            operation: 'backup.cleanup',
            targetId: `backup-retention:${payload.environment}`,
            ttlMs: 15 * 60_000,
          }, async () => backupRetentionJob(payload, context));
        },
      },
    });
    return { id: job.id, status: 'completed' as const, output: outcome };
  } catch (error) {
    if (isPermanent(error)) {
      await runs.rejectDelivery(job.id, failureDetails(error));
      return { id: job.id, status: 'deadletter' as const, output: failureDetails(error) };
    }
    return { id: job.id, status: 'failed' as const, output: failureDetails(error) };
  }
  }));
}

async function registerWork() {
  await Promise.all([
    boss.work<QueuedJob, unknown, typeof workOptions>(
      JOB_NAMES.mediaIntegrityScan,
      workOptions,
      processJobs,
    ),
    boss.work<QueuedJob, unknown, typeof workOptions>(
      JOB_NAMES.backupVerification,
      workOptions,
      processJobs,
    ),
    boss.work<QueuedJob, unknown, typeof workOptions>(
      JOB_NAMES.backupRetentionCleanup,
      workOptions,
      processJobs,
    ),
  ]);
}

const lifecycle = createWorkerLifecycle({
  queue: boss,
  registerWork,
  async disconnect() {
    await Promise.all([db.$disconnect(), redis.close()]);
  },
});
await lifecycle.start();

async function stopWorker(signal: string) {
  console.info('background_worker_draining', { signal });
  try {
    await lifecycle.stop();
    console.info('background_worker_stopped');
  } catch (error) {
    process.exitCode = 1;
    console.error('background_worker_stop_failed', error);
  }
}

process.once('SIGTERM', () => void stopWorker('SIGTERM'));
process.once('SIGINT', () => void stopWorker('SIGINT'));
