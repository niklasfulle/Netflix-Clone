import type { JobProgress, JobResult, QueuedJob } from '@/lib/jobs/contracts';
import { parseJobProgress, parseJobResult, parseQueuedJob } from '@/lib/jobs/contracts';

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
    const result = parseJobResult(await handlers.mediaIntegrityScan(job.payload, {
      signal: queue.signal,
      async reportProgress(value) {
        const progress = parseJobProgress(value);
        await runs.reportProgress(job.jobRunId, progress, now());
      },
    }));
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
    await runs.failAttempt(job.jobRunId, {
      attemptCount,
      deadLetter: queue.retryCount >= queue.retryLimit,
      ...failureDetails(error),
      failedAt: now(),
    });
    throw error;
  }
}
