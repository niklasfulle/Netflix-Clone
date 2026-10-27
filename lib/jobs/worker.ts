import type { JobProgress, JobResult, QueuedJob } from '@/lib/jobs/contracts';
import { JOB_NAMES, parseJobProgress, parseJobResult, parseQueuedJob } from '@/lib/jobs/contracts';

export type JobClaim = 'CLAIMED' | 'SUCCEEDED' | 'CANCELLED' | 'REJECTED';

export type JobExecutionRepository = {
  claim(input: {
    job: QueuedJob;
    queueJobId: string;
    attemptCount: number;
    startedAt: Date;
  }): Promise<JobClaim>;
  cancellationRequested(jobRunId: string): Promise<boolean>;
  reportProgress(jobRunId: string, progress: JobProgress, updatedAt: Date): Promise<void>;
  succeed(jobRunId: string, result: JobResult, completedAt: Date): Promise<boolean>;
  failAttempt(jobRunId: string, failure: {
    attemptCount: number;
    deadLetter: boolean;
    errorCode: string;
    errorMessage: string;
    failedAt: Date;
  }): Promise<void>;
  cancel(jobRunId: string, cancelledAt: Date): Promise<void>;
  rejectDelivery(queueJobId: string, failure: {
    errorCode: string;
    errorMessage: string;
    failedAt: Date;
  }): Promise<void>;
};

type WorkerHandlers = {
  mediaIntegrityScan(
    payload: { scope: 'catalog' } | { scope: 'content'; contentId: string },
    context: {
      signal?: AbortSignal;
      reportProgress(progress: JobProgress): Promise<void>;
    },
  ): Promise<unknown>;
  backupVerification?(
    payload: { scope: 'latest'; requestId: string; requestedAt: string },
    context: {
      signal?: AbortSignal;
      reportProgress(progress: JobProgress): Promise<void>;
    },
  ): Promise<unknown>;
  backupCreation?(
    payload: {
      scope: 'scheduled';
      environment: 'staging' | 'production';
      requestId: string;
      requestedAt: string;
    },
    context: {
      signal?: AbortSignal;
      reportProgress(progress: JobProgress): Promise<void>;
    },
  ): Promise<unknown>;
  backupRetention?(
    payload: {
      scope: 'scheduled';
      environment: 'staging' | 'production';
      requestId: string;
      requestedAt: string;
    },
    context: {
      signal?: AbortSignal;
      reportProgress(progress: JobProgress): Promise<void>;
    },
  ): Promise<unknown>;
};

type QueueDelivery = {
  id: string;
  retryCount: number;
  retryLimit: number;
  signal?: AbortSignal;
};

type ExecuteDependencies = {
  envelope: unknown;
  queue: QueueDelivery;
  runs: JobExecutionRepository;
  handlers: WorkerHandlers;
  now?: () => Date;
};

type HandlerContext = {
  signal?: AbortSignal;
  reportProgress(progress: JobProgress): Promise<void>;
};

export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

function failureDetails(error: unknown) {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorMessage = error instanceof Error ? error.message : 'Background job failed';
  return {
    errorCode: errorName.slice(0, 80),
    errorMessage: errorMessage.slice(0, 512),
  };
}

async function dispatchJob(
  job: QueuedJob,
  handlers: WorkerHandlers,
  context: HandlerContext,
): Promise<unknown> {
  if (job.name === JOB_NAMES.mediaIntegrityScan) {
    return handlers.mediaIntegrityScan(job.payload, context);
  }
  if (job.name === JOB_NAMES.backupVerification) {
    if (!handlers.backupVerification) {
      throw new PermanentJobError('No handler is registered for this job contract');
    }
    return handlers.backupVerification(job.payload, context);
  }
  if (job.name === JOB_NAMES.backupCreation) {
    if (!handlers.backupCreation) {
      throw new PermanentJobError('No handler is registered for this job contract');
    }
    return handlers.backupCreation(job.payload, context);
  }
  if (!handlers.backupRetention) {
    throw new PermanentJobError('No handler is registered for this job contract');
  }
  return handlers.backupRetention(job.payload, context);
}

export async function executeQueuedJob({
  envelope,
  queue,
  runs,
  handlers,
  now = () => new Date(),
}: ExecuteDependencies): Promise<{ status: 'SUCCEEDED' | 'CANCELLED'; duplicate: boolean }> {
  const job = parseQueuedJob(envelope, now());
  const attemptCount = queue.retryCount + 1;
  const claimed = await runs.claim({
    job,
    queueJobId: queue.id,
    attemptCount,
    startedAt: now(),
  });

  if (claimed === 'SUCCEEDED') return { status: 'SUCCEEDED', duplicate: true };
  if (claimed === 'CANCELLED') return { status: 'CANCELLED', duplicate: false };
  if (claimed === 'REJECTED') {
    const error = new PermanentJobError('Job ownership or contract metadata does not match');
    await runs.failAttempt(job.jobRunId, {
      attemptCount,
      deadLetter: true,
      ...failureDetails(error),
      failedAt: now(),
    });
    throw error;
  }

  if (await runs.cancellationRequested(job.jobRunId)) {
    await runs.cancel(job.jobRunId, now());
    return { status: 'CANCELLED', duplicate: false };
  }

  try {
    const handlerContext = {
      signal: queue.signal,
      async reportProgress(value: JobProgress) {
        const progress = parseJobProgress(value);
        await runs.reportProgress(job.jobRunId, progress, now());
      },
    };
    const output = await dispatchJob(job, handlers, handlerContext);
    const result = parseJobResult(output);
    if (await runs.cancellationRequested(job.jobRunId)) {
      await runs.cancel(job.jobRunId, now());
      return { status: 'CANCELLED', duplicate: false };
    }
    if (!await runs.succeed(job.jobRunId, result, now())) {
      await runs.cancel(job.jobRunId, now());
      return { status: 'CANCELLED', duplicate: false };
    }
    return { status: 'SUCCEEDED', duplicate: false };
  } catch (error) {
    if (queue.signal?.aborted || await runs.cancellationRequested(job.jobRunId)) {
      await runs.cancel(job.jobRunId, now());
      return { status: 'CANCELLED', duplicate: false };
    }
    await runs.failAttempt(job.jobRunId, {
      attemptCount,
      deadLetter: queue.retryCount >= queue.retryLimit,
      ...failureDetails(error),
      failedAt: now(),
    });
    throw error;
  }
}
