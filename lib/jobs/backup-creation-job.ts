import { setTimeout as delay } from 'node:timers/promises';

import type { ScheduledBackupStatus } from '@/lib/backup-verification';
import type { ScheduledBackupRequest } from '@/lib/scheduled-backup';

type BackupCreationPayload = {
  scope: 'scheduled';
  environment: 'staging' | 'production';
  requestId: string;
  requestedAt: string;
};

type BackupCreationContext = {
  signal?: AbortSignal;
  reportProgress(progress: { percent: number; message: string }): Promise<void>;
};

type Dependencies = {
  submitRequest(request: ScheduledBackupRequest): Promise<void>;
  readStatus(): Promise<ScheduledBackupStatus | null>;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  pollIntervalMs?: number;
  maxPolls?: number;
};

export class BackupCreationJobError extends Error {
  constructor(readonly diagnosticCode: string) {
    super(`Backup creation failed with ${diagnosticCode.slice(0, 80)}`);
    this.name = 'BackupCreationJobError';
  }
}

async function defaultWait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  await delay(milliseconds, undefined, { signal });
}

export function createBackupCreationJobHandler({
  submitRequest,
  readStatus,
  wait = defaultWait,
  pollIntervalMs = 1_000,
  maxPolls = 25 * 60,
}: Dependencies) {
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 250 || pollIntervalMs > 10_000) {
    throw new Error('Poll interval is outside its allowed range');
  }
  if (!Number.isSafeInteger(maxPolls) || maxPolls < 1 || maxPolls > 1_800) {
    throw new Error('Maximum polls is outside its allowed range');
  }

  return async function executeBackupCreation(
    payload: BackupCreationPayload,
    context: BackupCreationContext,
  ) {
    const baseline = await readStatus();
    await submitRequest({
      schemaVersion: 1,
      requestId: payload.requestId,
      requestedAt: payload.requestedAt,
      environment: payload.environment,
    });
    await context.reportProgress({ percent: 5, message: 'Database backup requested' });

    for (let poll = 0; poll < maxPolls; poll += 1) {
      context.signal?.throwIfAborted();
      const status = await readStatus();
      const belongsToRun = status?.requestId === payload.requestId
        && status.environment === payload.environment
        && status.backupName !== null
        && status.backupName !== baseline?.backupName;

      if (belongsToRun && status.status === 'VERIFIED') {
        await context.reportProgress({ percent: 95, message: 'Database backup verified' });
        return {
          backupRequestId: payload.requestId,
          status: 'VERIFIED' as const,
          environment: payload.environment,
          backupName: status.backupName,
        };
      }
      if (belongsToRun && status.status === 'FAILED') {
        throw new BackupCreationJobError(status.diagnosticCode);
      }
      await context.reportProgress({
        percent: belongsToRun ? 50 : 15,
        message: belongsToRun ? 'Database backup running' : 'Database backup pending',
      });
      await wait(pollIntervalMs, context.signal);
    }

    throw new BackupCreationJobError('BACKUP_POLL_TIMEOUT');
  };
}
