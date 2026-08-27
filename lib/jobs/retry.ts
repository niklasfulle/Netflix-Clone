import { randomUUID } from 'node:crypto';

import type { QueuedJob } from '@/lib/jobs/contracts';
import { parseJobSubmission } from '@/lib/jobs/contracts';
import {
  JobAccessDeniedError,
  JobRunNotFoundError,
  type JobActor,
} from '@/lib/jobs/control';
import {
  jobQueueOptions,
  type JobQueuePublisher,
} from '@/lib/jobs/submission';

type RetryCandidate = {
  id: string;
  jobType: string;
  contractVersion: number;
  idempotencyKey: string;
  queueJobId: string;
  actorUserId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  correlationId: string;
  status: string;
  payload: unknown;
};

type RetryTransaction = {
  jobRun: {
    findUnique(arguments_: {
      where: { id: string };
      select: Record<keyof RetryCandidate, true>;
    }): Promise<RetryCandidate | null>;
    updateMany(arguments_: {
      where: { id: string; status: { in: ['FAILED', 'DEAD_LETTER'] } };
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

export interface JobRetryDatabase {
  $transaction<T>(callback: (transaction: RetryTransaction) => Promise<T>): Promise<T>;
}

export class JobRetryNotAllowedError extends Error {
  constructor() {
    super('Background job cannot be retried from its current state');
    this.name = 'JobRetryNotAllowedError';
  }
}

const retrySelection: Record<keyof RetryCandidate, true> = {
  id: true,
  jobType: true,
  contractVersion: true,
  idempotencyKey: true,
  queueJobId: true,
  actorUserId: true,
  actorRole: true,
  targetType: true,
  targetId: true,
  correlationId: true,
  status: true,
  payload: true,
};

export function createJobRetryService({
  database,
  publisher,
  now = () => new Date(),
  createQueueJobId = randomUUID,
}: {
  database: JobRetryDatabase;
  publisher: JobQueuePublisher;
  now?: () => Date;
  createQueueJobId?: () => string;
}) {
  return {
    async retry(jobRunId: string, actor: JobActor) {
      if (actor.role !== 'ADMIN') throw new JobAccessDeniedError();
      return database.$transaction(async (transaction) => {
        const record = await transaction.jobRun.findUnique({
          where: { id: jobRunId },
          select: retrySelection,
        });
        if (!record) throw new JobRunNotFoundError();
        if (['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(record.status)) {
          return { ...record, duplicate: true };
        }
        if (!['FAILED', 'DEAD_LETTER'].includes(record.status)) {
          throw new JobRetryNotAllowedError();
        }

        const submission = parseJobSubmission({
          name: record.jobType,
          version: record.contractVersion,
          payload: record.payload,
          actor: { userId: record.actorUserId, role: record.actorRole },
          target: { type: record.targetType, id: record.targetId },
          idempotencyKey: record.idempotencyKey,
          correlationId: record.correlationId,
        });
        const acceptedAt = now();
        const queueJobId = createQueueJobId();
        const envelope: QueuedJob = {
          ...submission,
          jobRunId: record.id,
          acceptedAt: acceptedAt.toISOString(),
        };
        const queueDatabase = {
          async executeSql(text: string, values: unknown[] = []) {
            const rows = await transaction.$queryRawUnsafe<unknown[]>(text, ...values);
            return { rows };
          },
        };
        const publishedId = await publisher.send(
          submission.name,
          envelope,
          jobQueueOptions({
            jobName: submission.name,
            queueJobId,
            singletonKey: record.idempotencyKey,
            database: queueDatabase,
          }),
        );
        if (publishedId !== queueJobId) throw new Error('Queue rejected the retried job');

        const updated = await transaction.jobRun.updateMany({
          where: { id: jobRunId, status: { in: ['FAILED', 'DEAD_LETTER'] } },
          data: {
            queueJobId,
            status: 'QUEUED',
            progress: 0,
            progressMessage: 'Retry queued',
            attemptCount: 0,
            result: null,
            errorCode: null,
            errorMessage: null,
            startedAt: null,
            completedAt: null,
            cancelRequestedAt: null,
          },
        });
        if (updated.count !== 1) throw new Error('Background job changed while retry was queued');
        return { ...record, queueJobId, status: 'QUEUED' as const, duplicate: false };
      });
    },
  };
}
