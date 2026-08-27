import { JobAccessDeniedError, type JobActor } from '@/lib/jobs/control';

export const JOB_ADMIN_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCEL_REQUESTED',
  'CANCELLED',
  'DEAD_LETTER',
] as const;

export type JobAdministrationStatus = typeof JOB_ADMIN_STATUSES[number];

export class InvalidJobListCursorError extends Error {
  constructor() {
    super('Invalid job list cursor');
    this.name = 'InvalidJobListCursorError';
  }
}

type StoredJobRun = {
  id: string;
  jobType: string;
  status: JobAdministrationStatus;
  progress: number;
  progressMessage: string | null;
  attemptCount: number;
  actorUserId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  correlationId: string;
  errorCode: string | null;
  acceptedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelRequestedAt: Date | null;
  updatedAt: Date;
};

type JobRunFindManyArguments = {
  where: Record<string, unknown>;
  orderBy: Array<Record<string, 'asc' | 'desc'>>;
  select: Record<keyof StoredJobRun, true>;
  take: number;
};

export interface JobAdministrationDatabase {
  jobRun: {
    findMany(arguments_: JobRunFindManyArguments): Promise<StoredJobRun[]>;
    groupBy(arguments_: {
      by: ['status'];
      _count: { _all: true };
    }): Promise<Array<{ status: JobAdministrationStatus; _count: { _all: number } }>>;
    findFirst(arguments_: {
      where: { status: 'QUEUED' };
      orderBy: { acceptedAt: 'asc' };
      select: { acceptedAt: true };
    }): Promise<{ acceptedAt: Date } | null>;
  };
  jobWorkerHeartbeat: {
    findUnique(arguments_: {
      where: { id: 'primary' };
      select: {
        state: true;
        startedAt: true;
        heartbeatAt: true;
        stoppedAt: true;
      };
    }): Promise<{
      state: string;
      startedAt: Date;
      heartbeatAt: Date;
      stoppedAt: Date | null;
    } | null>;
  };
}

export type JobAdministrationListInput = {
  status?: JobAdministrationStatus;
  jobType?: string;
  cursor?: string;
  limit?: number;
};

type Cursor = {
  acceptedAt: string;
  id: string;
};

const jobRunSelect: Record<keyof StoredJobRun, true> = {
  id: true,
  jobType: true,
  status: true,
  progress: true,
  progressMessage: true,
  attemptCount: true,
  actorUserId: true,
  actorRole: true,
  targetType: true,
  targetId: true,
  correlationId: true,
  errorCode: true,
  acceptedAt: true,
  startedAt: true,
  completedAt: true,
  cancelRequestedAt: true,
  updatedAt: true,
};

function assertAdministrator(actor: JobActor): void {
  if (actor.role !== 'ADMIN') throw new JobAccessDeniedError();
}

function encodeCursor(job: StoredJobRun): string {
  return Buffer.from(JSON.stringify({
    acceptedAt: job.acceptedAt.toISOString(),
    id: job.id,
  } satisfies Cursor), 'utf8').toString('base64url');
}

function decodeCursor(value: string): Cursor {
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<Cursor>;
    if (!cursor.id || !cursor.acceptedAt || Number.isNaN(Date.parse(cursor.acceptedAt))) {
      throw new Error('Invalid cursor');
    }
    return { id: cursor.id, acceptedAt: cursor.acceptedAt };
  } catch {
    throw new InvalidJobListCursorError();
  }
}

function boundedLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 25;
  return Math.min(50, Math.max(1, Math.trunc(value ?? 25)));
}

function publicJobRun(job: StoredJobRun) {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    progress: job.progress,
    progressMessage: job.progressMessage,
    attemptCount: job.attemptCount,
    actor: { userId: job.actorUserId, role: job.actorRole },
    target: { type: job.targetType, id: job.targetId },
    correlationId: job.correlationId,
    failure: job.errorCode
      ? {
        code: job.errorCode,
        message: 'Background operation failed. Review server logs using the correlation ID.',
      }
      : null,
    acceptedAt: job.acceptedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    cancelRequestedAt: job.cancelRequestedAt,
    updatedAt: job.updatedAt,
  };
}

export function createJobAdministrationService({
  database,
  now = () => new Date(),
}: {
  database: JobAdministrationDatabase;
  now?: () => Date;
}) {
  return {
    async list(actor: JobActor, input: JobAdministrationListInput = {}) {
      assertAdministrator(actor);
      const limit = boundedLimit(input.limit);
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      if (input.jobType) where.jobType = input.jobType;
      if (input.cursor) {
        const cursor = decodeCursor(input.cursor);
        const acceptedAt = new Date(cursor.acceptedAt);
        where.OR = [
          { acceptedAt: { lt: acceptedAt } },
          { acceptedAt, id: { lt: cursor.id } },
        ];
      }

      const rows = await database.jobRun.findMany({
        where,
        orderBy: [{ acceptedAt: 'desc' }, { id: 'desc' }],
        select: jobRunSelect,
        take: limit + 1,
      });
      const items = rows.slice(0, limit);
      const lastItem = items.at(-1);

      return {
        items: items.map(publicJobRun),
        nextCursor: rows.length > limit && lastItem ? encodeCursor(lastItem) : null,
      };
    },

    async health(actor: JobActor) {
      assertAdministrator(actor);
      const [groupedCounts, oldestQueued, heartbeat] = await Promise.all([
        database.jobRun.groupBy({ by: ['status'], _count: { _all: true } }),
        database.jobRun.findFirst({
          where: { status: 'QUEUED' },
          orderBy: { acceptedAt: 'asc' },
          select: { acceptedAt: true },
        }),
        database.jobWorkerHeartbeat.findUnique({
          where: { id: 'primary' },
          select: {
            state: true,
            startedAt: true,
            heartbeatAt: true,
            stoppedAt: true,
          },
        }),
      ]);
      const timestamp = now().getTime();
      const counts = Object.fromEntries(JOB_ADMIN_STATUSES.map((status) => [status, 0])) as Record<
        JobAdministrationStatus,
        number
      >;
      for (const group of groupedCounts) counts[group.status] = group._count._all;
      const heartbeatAgeMs = heartbeat
        ? Math.max(0, timestamp - heartbeat.heartbeatAt.getTime())
        : null;

      let workerStatus = 'unavailable';
      if (heartbeat?.state === 'ACTIVE') {
        workerStatus = heartbeatAgeMs !== null && heartbeatAgeMs <= 45_000 ? 'healthy' : 'stale';
      } else if (heartbeat?.state === 'FAILED') {
        workerStatus = 'degraded';
      } else if (heartbeat?.state === 'STARTING') {
        workerStatus = 'starting';
      } else if (heartbeat) {
        workerStatus = 'disconnected';
      }

      return {
        worker: {
          status: workerStatus,
          state: heartbeat?.state ?? 'UNKNOWN',
          startedAt: heartbeat?.startedAt ?? null,
          heartbeatAt: heartbeat?.heartbeatAt ?? null,
          stoppedAt: heartbeat?.stoppedAt ?? null,
          heartbeatAgeMs,
        },
        queue: {
          depth: counts.QUEUED + counts.RUNNING + counts.CANCEL_REQUESTED,
          oldestQueuedAt: oldestQueued?.acceptedAt ?? null,
          oldestQueuedAgeMs: oldestQueued
            ? Math.max(0, timestamp - oldestQueued.acceptedAt.getTime())
            : null,
        },
        counts,
        observedAt: new Date(timestamp),
      };
    },
  };
}
