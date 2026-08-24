/** @jest-environment node */

import { executeQueuedJob, PermanentJobError } from '@/lib/jobs/worker';

const envelope = {
  name: 'media.integrity.scan' as const,
  version: 1 as const,
  payload: { scope: 'catalog' as const },
  actor: { userId: 'admin-user-123', role: 'ADMIN' as const },
  target: { type: 'catalog' as const, id: 'published' as const },
  idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
  correlationId: 'request-correlation-123',
  jobRunId: 'job-run-123',
  acceptedAt: '2026-08-23T10:00:00.000Z',
};

function runRepository(claim: 'CLAIMED' | 'SUCCEEDED' | 'CANCELLED' | 'REJECTED' = 'CLAIMED') {
  return {
    claim: jest.fn().mockResolvedValue(claim),
    cancellationRequested: jest.fn().mockResolvedValue(false),
    reportProgress: jest.fn().mockResolvedValue(undefined),
    succeed: jest.fn().mockResolvedValue(true),
    failAttempt: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    rejectDelivery: jest.fn().mockResolvedValue(undefined),
  };
}

describe('background job worker', () => {
  it('persists a bounded result before reporting successful execution', async () => {
    const runs = runRepository();
    const handler = jest.fn().mockResolvedValue({
      scanRunId: 'media-scan-123',
      contentCount: 4,
      findingCount: 1,
      criticalCount: 0,
      warningCount: 1,
    });

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'SUCCEEDED', duplicate: false });

    expect(runs.succeed).toHaveBeenCalledWith('job-run-123', {
      scanRunId: 'media-scan-123',
      contentCount: 4,
      findingCount: 1,
      criticalCount: 0,
      warningCount: 1,
    }, new Date('2026-08-23T10:01:00.000Z'));
  });

  it('does not execute a duplicate delivery whose durable run already succeeded', async () => {
    const runs = runRepository('SUCCEEDED');
    const handler = jest.fn();

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'SUCCEEDED', duplicate: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('persists failure and rethrows so the queue can retry', async () => {
    const runs = runRepository();
    const handler = jest.fn().mockRejectedValue(new Error('scanner crashed'));

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 1, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).rejects.toThrow('scanner crashed');
    expect(runs.failAttempt).toHaveBeenCalledWith('job-run-123', expect.objectContaining({
      attemptCount: 2,
      deadLetter: false,
      errorMessage: 'scanner crashed',
    }));
    expect(runs.succeed).not.toHaveBeenCalled();
  });

  it('marks the final failed attempt as dead-lettered', async () => {
    const runs = runRepository();

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 3, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: jest.fn().mockRejectedValue(new Error('still broken')) },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).rejects.toThrow('still broken');
    expect(runs.failAttempt).toHaveBeenCalledWith('job-run-123', expect.objectContaining({ deadLetter: true }));
  });

  it('honors durable cancellation before executing work', async () => {
    const runs = runRepository('CANCELLED');
    const handler = jest.fn();

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'CANCELLED', duplicate: false });
    expect(handler).not.toHaveBeenCalled();
  });

  it('dead-letters a delivery rejected by durable ownership checks', async () => {
    const runs = runRepository('REJECTED');
    const handler = jest.fn();

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).rejects.toBeInstanceOf(PermanentJobError);

    expect(runs.failAttempt).toHaveBeenCalledWith('job-run-123', {
      attemptCount: 1,
      deadLetter: true,
      errorCode: 'PermanentJobError',
      errorMessage: 'Job ownership or contract metadata does not match',
      failedAt: new Date('2026-08-23T10:01:00.000Z'),
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('cancels a claimed job when cancellation was requested before execution', async () => {
    const runs = runRepository();
    runs.cancellationRequested.mockResolvedValue(true);
    const handler = jest.fn();

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'CANCELLED', duplicate: false });

    expect(runs.cancel).toHaveBeenCalledWith(
      'job-run-123',
      new Date('2026-08-23T10:01:00.000Z'),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('persists progress and cancels when cancellation arrives during execution', async () => {
    const runs = runRepository();
    runs.cancellationRequested.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const abortController = new AbortController();
    const handler = jest.fn(async (
      _payload: unknown,
      context: {
        signal?: AbortSignal;
        reportProgress(progress: { percent: number; message: string }): Promise<void>;
      },
    ) => {
      expect(context.signal).toBe(abortController.signal);
      await context.reportProgress({ percent: 50, message: 'Halfway complete' });
      return {
        scanRunId: 'media-scan-123',
        contentCount: 4,
        findingCount: 1,
        criticalCount: 0,
        warningCount: 1,
      };
    });

    await expect(executeQueuedJob({
      envelope,
      queue: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        retryCount: 0,
        retryLimit: 3,
        signal: abortController.signal,
      },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'CANCELLED', duplicate: false });

    expect(runs.reportProgress).toHaveBeenCalledWith(
      'job-run-123',
      { percent: 50, message: 'Halfway complete' },
      new Date('2026-08-23T10:01:00.000Z'),
    );
    expect(runs.cancel).toHaveBeenCalledWith(
      'job-run-123',
      new Date('2026-08-23T10:01:00.000Z'),
    );
    expect(runs.succeed).not.toHaveBeenCalled();
  });

  it('reports cancellation when durable completion loses a cancellation race', async () => {
    const runs = runRepository();
    runs.succeed.mockResolvedValue(false);
    const handler = jest.fn().mockResolvedValue({
      scanRunId: 'media-scan-123',
      contentCount: 4,
      findingCount: 1,
      criticalCount: 0,
      warningCount: 1,
    });

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).resolves.toEqual({ status: 'CANCELLED', duplicate: false });

    expect(runs.cancel).toHaveBeenCalledWith(
      'job-run-123',
      new Date('2026-08-23T10:01:00.000Z'),
    );
  });

  it('uses bounded fallback diagnostics when a handler rejects with a non-Error value', async () => {
    const runs = runRepository();
    const handler = jest.fn().mockRejectedValue('scanner stopped unexpectedly');

    await expect(executeQueuedJob({
      envelope,
      queue: { id: '550e8400-e29b-41d4-a716-446655440000', retryCount: 0, retryLimit: 3 },
      runs,
      handlers: { mediaIntegrityScan: handler },
      now: () => new Date('2026-08-23T10:01:00.000Z'),
    })).rejects.toBe('scanner stopped unexpectedly');

    expect(runs.failAttempt).toHaveBeenCalledWith('job-run-123', expect.objectContaining({
      attemptCount: 1,
      deadLetter: false,
      errorCode: 'UnknownError',
      errorMessage: 'Background job failed',
      failedAt: new Date('2026-08-23T10:01:00.000Z'),
    }));
  });
});
