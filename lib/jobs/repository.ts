import type { JobExecutionRepository } from '@/lib/jobs/worker';

type StoredJobRun = {
  id: string;
  queueJobId: string;
  jobType: string;
  contractVersion: number;
  actorUserId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  correlationId: string;
  status: string;
  cancelRequestedAt: Date | null;
};

type JobRunDatabase = {
  jobRun: {
    findUnique(args: {
      where: { id: string };
      select: Record<keyof StoredJobRun, true>;
    }): Promise<StoredJobRun | null>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
};

const storedJobSelection: Record<keyof StoredJobRun, true> = {
  id: true,
  queueJobId: true,
  jobType: true,
  contractVersion: true,
  actorUserId: true,
  actorRole: true,
  targetType: true,
  targetId: true,
  correlationId: true,
  status: true,
  cancelRequestedAt: true,
};

function metadataMatches(
  record: StoredJobRun,
  queueJobId: string,
  job: Parameters<JobExecutionRepository['claim']>[0]['job'],
): boolean {
  return record.queueJobId === queueJobId
    && record.jobType === job.name
    && record.contractVersion === job.version
    && record.actorUserId === job.actor.userId
    && record.actorRole === job.actor.role
    && record.targetType === job.target.type
    && record.targetId === job.target.id
    && record.correlationId === job.correlationId;
}

export function createPrismaJobExecutionRepository(database: JobRunDatabase): JobExecutionRepository {
  return {
    async claim({ job, queueJobId, attemptCount, startedAt }) {
      const record = await database.jobRun.findUnique({
        where: { id: job.jobRunId },
        select: storedJobSelection,
      });
      if (!record || !metadataMatches(record, queueJobId, job)) return 'REJECTED';
      if (record.status === 'SUCCEEDED') return 'SUCCEEDED';
      if (record.status === 'CANCELLED' || record.status === 'CANCEL_REQUESTED') return 'CANCELLED';
      if (!['QUEUED', 'FAILED'].includes(record.status)) return 'REJECTED';

      const claimed = await database.jobRun.updateMany({
        where: {
          id: job.jobRunId,
          queueJobId,
          status: { in: ['QUEUED', 'FAILED'] },
          cancelRequestedAt: null,
        },
        data: {
          status: 'RUNNING',
          attemptCount,
          startedAt,
          completedAt: null,
          errorCode: null,
          errorMessage: null,
        },
      });
      return claimed.count === 1 ? 'CLAIMED' : 'REJECTED';
    },

    async cancellationRequested(jobRunId) {
      const record = await database.jobRun.findUnique({
        where: { id: jobRunId },
        select: storedJobSelection,
      });
      return record?.status === 'CANCEL_REQUESTED' || record?.status === 'CANCELLED';
    },

    async reportProgress(jobRunId, progress, updatedAt) {
      await database.jobRun.updateMany({
        where: { id: jobRunId, status: 'RUNNING', cancelRequestedAt: null },
        data: {
          progress: progress.percent,
          progressMessage: progress.message,
          updatedAt,
        },
      });
    },

    async succeed(jobRunId, result, completedAt) {
      const updated = await database.jobRun.updateMany({
        where: { id: jobRunId, status: 'RUNNING', cancelRequestedAt: null },
        data: {
          status: 'SUCCEEDED',
          progress: 100,
          progressMessage: 'Completed',
          result,
          completedAt,
          errorCode: null,
          errorMessage: null,
        },
      });
      return updated.count === 1;
    },

    async failAttempt(jobRunId, failure) {
      await database.jobRun.updateMany({
        where: {
          id: jobRunId,
          status: { in: ['RUNNING', 'QUEUED', 'FAILED'] },
        },
        data: {
          status: failure.deadLetter ? 'DEAD_LETTER' : 'FAILED',
          attemptCount: failure.attemptCount,
          errorCode: failure.errorCode,
          errorMessage: failure.errorMessage,
          completedAt: failure.deadLetter ? failure.failedAt : null,
        },
      });
    },

    async cancel(jobRunId, cancelledAt) {
      await database.jobRun.updateMany({
        where: {
          id: jobRunId,
          status: { in: ['QUEUED', 'RUNNING', 'FAILED', 'CANCEL_REQUESTED'] },
        },
        data: {
          status: 'CANCELLED',
          completedAt: cancelledAt,
          progressMessage: 'Cancelled',
        },
      });
    },

    async rejectDelivery(queueJobId, failure) {
      await database.jobRun.updateMany({
        where: {
          queueJobId,
          status: { in: ['QUEUED', 'RUNNING', 'FAILED'] },
        },
        data: {
          status: 'DEAD_LETTER',
          errorCode: failure.errorCode.slice(0, 80),
          errorMessage: failure.errorMessage.slice(0, 512),
          completedAt: failure.failedAt,
        },
      });
    },
  };
}
