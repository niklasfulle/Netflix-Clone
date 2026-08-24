import { createHash, randomUUID } from 'node:crypto';

import type { JobSubmission, QueuedJob } from '@/lib/jobs/contracts';
import { JOB_NAMES, parseJobSubmission } from '@/lib/jobs/contracts';

type JobRunRecord = {
  id: string;
  queueJobId: string | null;
  status: string;
  correlationId: string;
};

type JobRunLookup = {
  jobType_idempotencyKey: {
    jobType: string;
    idempotencyKey: string;
  };
};

type JobRunOperations = {
  findUnique(args: { where: JobRunLookup }): Promise<JobRunRecord | null>;
  create(args: {
    data: {
      jobType: string;
      contractVersion: number;
      idempotencyKey: string;
      queueJobId: string;
      actorUserId: string;
      actorRole: string;
      targetType: string;
      targetId: string;
      correlationId: string;
      status: 'QUEUED';
      payload: JobSubmission['payload'];
      acceptedAt: Date;
    };
  }): Promise<JobRunRecord>;
};

type JobTransaction = {
  jobRun: JobRunOperations;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

export type JobSubmissionDatabase = {
  jobRun: Pick<JobRunOperations, 'findUnique'>;
  $transaction<T>(callback: (transaction: JobTransaction) => Promise<T>): Promise<T>;
};

type QueueSendOptions = {
  id: string;
  retryLimit: number;
  retryDelay: number;
  retryBackoff: boolean;
  retryDelayMax: number;
  expireInSeconds: number;
  retentionSeconds: number;
  deleteAfterSeconds: number;
  heartbeatSeconds: number;
  singletonKey: string;
  deadLetter: string;
  db: {
    executeSql(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  };
};

export type JobQueuePublisher = {
  send(name: string, data: object, options: QueueSendOptions): Promise<string | null>;
};

export type JobAcceptance = {
  id: string;
  queueJobId: string;
  status: string;
  duplicate: boolean;
  correlationId: string;
};

type SubmissionServiceDependencies = {
  database: JobSubmissionDatabase;
  publisher: JobQueuePublisher;
  now?: () => Date;
  createQueueJobId?: () => string;
};

function lookup(submission: JobSubmission): JobRunLookup {
  return {
    jobType_idempotencyKey: {
      jobType: submission.name,
      idempotencyKey: submission.idempotencyKey,
    },
  };
}

function scopeIdempotencyKey(submission: JobSubmission): JobSubmission {
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify({
      jobType: submission.name,
      actorUserId: submission.actor.userId,
      targetType: submission.target.type,
      targetId: submission.target.id,
      requestKey: submission.idempotencyKey,
    }))
    .digest('base64url');
  return { ...submission, idempotencyKey };
}

function acceptance(record: JobRunRecord, duplicate: boolean): JobAcceptance {
  if (!record.queueJobId) throw new Error('Accepted job is missing its queue identifier');
  return {
    id: record.id,
    queueJobId: record.queueJobId,
    status: record.status,
    duplicate,
    correlationId: record.correlationId,
  };
}

export function createJobSubmissionService({
  database,
  publisher,
  now = () => new Date(),
  createQueueJobId = randomUUID,
}: SubmissionServiceDependencies) {
  return {
    async submit(value: unknown): Promise<JobAcceptance> {
      const submission = scopeIdempotencyKey(parseJobSubmission(value));
      const existing = await database.jobRun.findUnique({ where: lookup(submission) });
      if (existing) return acceptance(existing, true);

      try {
        return await database.$transaction(async (transaction) => {
          const duplicate = await transaction.jobRun.findUnique({ where: lookup(submission) });
          if (duplicate) return acceptance(duplicate, true);

          const acceptedAt = now();
          const queueJobId = createQueueJobId();
          const record = await transaction.jobRun.create({
            data: {
              jobType: submission.name,
              contractVersion: submission.version,
              idempotencyKey: submission.idempotencyKey,
              queueJobId,
              actorUserId: submission.actor.userId,
              actorRole: submission.actor.role,
              targetType: submission.target.type,
              targetId: submission.target.id,
              correlationId: submission.correlationId,
              status: 'QUEUED',
              payload: submission.payload,
              acceptedAt,
            },
          });
          const envelope: QueuedJob = {
            ...submission,
            jobRunId: record.id,
            acceptedAt: acceptedAt.toISOString(),
          };
          const publishedId = await publisher.send(submission.name, envelope, {
            id: queueJobId,
            retryLimit: 3,
            retryDelay: 5,
            retryBackoff: true,
            retryDelayMax: 60,
            expireInSeconds: 15 * 60,
            retentionSeconds: 24 * 60 * 60,
            deleteAfterSeconds: 7 * 24 * 60 * 60,
            heartbeatSeconds: 30,
            singletonKey: submission.idempotencyKey,
            deadLetter: JOB_NAMES.mediaIntegrityScanDeadLetter,
            db: {
              async executeSql(text, values = []) {
                const rows = await transaction.$queryRawUnsafe<unknown[]>(text, ...values);
                return { rows };
              },
            },
          });
          if (publishedId !== queueJobId) throw new Error('Queue rejected the accepted job');
          return acceptance(record, false);
        });
      } catch (error) {
        if ((error as { code?: unknown }).code === 'P2002') {
          const winner = await database.jobRun.findUnique({ where: lookup(submission) });
          if (winner) return acceptance(winner, true);
        }
        throw error;
      }
    },
  };
}
