import { setTimeout as delay } from 'node:timers/promises';

import type { BackupRetentionRequest } from '@/lib/backup-retention';

type Environment = 'staging' | 'production';

type BackupRetentionStatus = {
  requestId: string | null;
  environment: Environment;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BUSY';
  diagnosticCode: string;
  retainedCount: number | null;
  removedCount: number | null;
};

type Payload = Omit<BackupRetentionRequest, 'schemaVersion'> & {
  scope: 'scheduled';
};

type Context = {
  signal?: AbortSignal;
  reportProgress(progress: { percent: number; message: string }): Promise<void>;
};

type Dependencies = {
  submitRequest(request: BackupRetentionRequest): Promise<void>;
  readStatus(): Promise<BackupRetentionStatus | null>;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  pollIntervalMs?: number;
  maxPolls?: number;
};

export class BackupRetentionJobError extends Error {
  constructor(readonly diagnosticCode: string) {
    super(`Backup retention cleanup failed with ${diagnosticCode.slice(0, 80)}`);
    this.name = 'BackupRetentionJobError';
  }
}

function boundedInteger(value: number, minimum: number, maximum: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} is outside its allowed range`);
  }
  return value;
}

async function defaultWait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  await delay(milliseconds, undefined, { signal });
}

export function createBackupRetentionJobHandler({
  submitRequest,
  readStatus,
  wait = defaultWait,
  pollIntervalMs = 1_000,
  maxPolls = 5 * 60,
}: Dependencies) {
  const boundedPollInterval = boundedInteger(pollIntervalMs, 250, 10_000, 'Poll interval');
  const boundedMaxPolls = boundedInteger(maxPolls, 1, 900, 'Maximum polls');

  return async function executeBackupRetention(payload: Payload, context: Context) {
    await submitRequest({
      schemaVersion: 1,
      requestId: payload.requestId,
      requestedAt: payload.requestedAt,
      environment: payload.environment,
    });
    await context.reportProgress({ percent: 5, message: 'Backup retention cleanup requested' });

    for (let poll = 0; poll < boundedMaxPolls; poll += 1) {
      context.signal?.throwIfAborted();
      const status = await readStatus();
      if (status?.requestId === payload.requestId && status.environment === payload.environment) {
        if (status.status === 'COMPLETED') {
          const retainedCount = boundedInteger(
            status.retainedCount ?? -1,
            0,
            1_000_000,
            'Retained backup count',
          );
          const removedCount = boundedInteger(
            status.removedCount ?? -1,
            0,
            1_000_000,
            'Removed backup count',
          );
          await context.reportProgress({ percent: 95, message: 'Backup retention cleanup completed' });
          return {
            cleanupRequestId: payload.requestId,
            status: 'COMPLETED' as const,
            environment: payload.environment,
            retainedCount,
            removedCount,
          };
        }
        if (status.status !== 'RUNNING') {
          throw new BackupRetentionJobError(status.diagnosticCode);
        }
        await context.reportProgress({ percent: 60, message: 'Backup retention cleanup running' });
      }
      await wait(boundedPollInterval, context.signal);
    }

    throw new BackupRetentionJobError('RETENTION_POLL_TIMEOUT');
  };
}
