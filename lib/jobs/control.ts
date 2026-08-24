export type JobActor = {
  userId: string;
  role: 'ADMIN' | 'USER';
};

type JobRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'DEAD_LETTER';

export type JobRunStatusView = {
  id: string;
  jobType: string;
  queueJobId: string;
  status: JobRunStatus;
  progress: number;
  progressMessage: string | null;
  attemptCount: number;
  result: unknown;
  errorCode: string | null;
  errorMessage: string | null;
  correlationId: string;
  acceptedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelRequestedAt: Date | null;
};

type JobRunOperations = {
  findUnique(args: {
    where: { id: string };
    select: Record<keyof JobRunStatusView, true>;
  }): Promise<JobRunStatusView | null>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
};

type JobControlTransaction = {
  jobRun: JobRunOperations;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

export type JobControlDatabase = {
  jobRun: Pick<JobRunOperations, 'findUnique'>;
  $transaction<T>(callback: (transaction: JobControlTransaction) => Promise<T>): Promise<T>;
};

type JobQueueControl = {
  cancel(name: string, id: string, options: {
    db: { executeSql(text: string, values?: unknown[]): Promise<{ rows: unknown[] }> };
  }): Promise<unknown>;
};

export class JobAccessDeniedError extends Error {
  constructor() {
    super('Administrator authorization is required');
    this.name = 'JobAccessDeniedError';
  }
}

export class JobRunNotFoundError extends Error {
  constructor() {
    super('Background job was not found');
    this.name = 'JobRunNotFoundError';
  }
}

const statusSelection: Record<keyof JobRunStatusView, true> = {
  id: true,
  jobType: true,
  queueJobId: true,
  status: true,
  progress: true,
  progressMessage: true,
  attemptCount: true,
  result: true,
  errorCode: true,
  errorMessage: true,
  correlationId: true,
  acceptedAt: true,
  startedAt: true,
  completedAt: true,
  cancelRequestedAt: true,
};

function authorize(actor: JobActor): void {
  if (actor.role !== 'ADMIN') throw new JobAccessDeniedError();
}

function withCancellation(
  record: JobRunStatusView,
  status: 'CANCEL_REQUESTED' | 'CANCELLED',
  now: Date,
): JobRunStatusView {
  return {
    ...record,
    status,
    cancelRequestedAt: now,
    completedAt: status === 'CANCELLED' ? now : record.completedAt,
    progressMessage: status === 'CANCELLED' ? 'Cancelled' : 'Cancellation requested',
  };
}

export function createJobControlService({
  database,
  queue,
  now = () => new Date(),
}: {
  database: JobControlDatabase;
  queue: JobQueueControl;
  now?: () => Date;
}) {
  return {
    async get(jobRunId: string, actor: JobActor): Promise<JobRunStatusView> {
      authorize(actor);
      const record = await database.jobRun.findUnique({
        where: { id: jobRunId },
        select: statusSelection,
      });
      if (!record) throw new JobRunNotFoundError();
      return record;
    },

    async cancel(jobRunId: string, actor: JobActor): Promise<JobRunStatusView> {
      authorize(actor);
      return database.$transaction(async (transaction) => {
        const record = await transaction.jobRun.findUnique({
          where: { id: jobRunId },
          select: statusSelection,
        });
        if (!record) throw new JobRunNotFoundError();
        if (['SUCCEEDED', 'CANCELLED', 'DEAD_LETTER', 'CANCEL_REQUESTED'].includes(record.status)) {
          return record;
        }

        const requestedAt = now();
        if (record.status === 'RUNNING') {
          const updated = await transaction.jobRun.updateMany({
            where: { id: jobRunId, status: 'RUNNING', cancelRequestedAt: null },
            data: {
              status: 'CANCEL_REQUESTED',
              cancelRequestedAt: requestedAt,
              progressMessage: 'Cancellation requested',
            },
          });
          if (updated.count !== 1) throw new Error('Background job changed while cancellation was requested');
          return withCancellation(record, 'CANCEL_REQUESTED', requestedAt);
        }

        const queueDatabase = {
          async executeSql(text: string, values: unknown[] = []) {
            const rows = await transaction.$queryRawUnsafe<unknown[]>(text, ...values);
            return { rows };
          },
        };
        await queue.cancel(record.jobType, record.queueJobId, { db: queueDatabase });
        const updated = await transaction.jobRun.updateMany({
          where: { id: jobRunId, status: { in: ['QUEUED', 'FAILED'] } },
          data: {
            status: 'CANCELLED',
            cancelRequestedAt: requestedAt,
            completedAt: requestedAt,
            progressMessage: 'Cancelled',
          },
        });
        if (updated.count !== 1) throw new Error('Background job changed while cancellation was requested');
        return withCancellation(record, 'CANCELLED', requestedAt);
      });
    },
  };
}
