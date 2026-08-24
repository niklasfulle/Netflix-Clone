import { setTimeout as delay } from 'node:timers/promises';

import type { BackupVerificationRequest } from '@/lib/backup-verification';

type VerificationStatusSnapshot = {
  requestId: string | null;
  backupName: string | null;
  status: 'PENDING' | 'RUNNING' | 'VERIFIED' | 'CORRUPT' | 'TRUNCATED'
    | 'INCOMPATIBLE' | 'TIMEOUT' | 'FAILED' | 'INTERRUPTED' | 'BUSY';
  diagnosticCode: string;
};

type BackupVerificationPayload = {
  scope: 'latest';
  requestId: string;
  requestedAt: string;
};

type BackupVerificationContext = {
  signal?: AbortSignal;
  reportProgress(progress: { percent: number; message: string }): Promise<void>;
};

type BackupVerificationResult = {
  verificationRequestId: string;
  status: 'VERIFIED';
  diagnosticCode: 'VERIFICATION_SUCCEEDED';
  backupName: string;
};

type Dependencies = {
  submitRequest(request: BackupVerificationRequest): Promise<void>;
  readStatus(): Promise<VerificationStatusSnapshot | null>;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  pollIntervalMs?: number;
  maxPolls?: number;
};

const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING']);

export class BackupVerificationJobError extends Error {
  constructor(readonly diagnosticCode: string) {
    super(`Backup verification failed with ${diagnosticCode.slice(0, 80)}`);
    this.name = 'BackupVerificationJobError';
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

async function evaluateStatus(
  status: VerificationStatusSnapshot | null,
  requestId: string,
  context: BackupVerificationContext,
): Promise<BackupVerificationResult | null> {
  if (status?.requestId !== requestId) return null;

  if (status.status === 'VERIFIED') {
    if (!status.backupName) {
      throw new BackupVerificationJobError('VERIFIED_RESULT_INCOMPLETE');
    }
    await context.reportProgress({ percent: 95, message: 'Backup verification completed' });
    return {
      verificationRequestId: requestId,
      status: 'VERIFIED',
      diagnosticCode: 'VERIFICATION_SUCCEEDED',
      backupName: status.backupName,
    };
  }

  if (!ACTIVE_STATUSES.has(status.status)) {
    throw new BackupVerificationJobError(status.diagnosticCode);
  }

  const isRunning = status.status === 'RUNNING';
  await context.reportProgress({
    percent: isRunning ? 60 : 20,
    message: isRunning ? 'Backup verification running' : 'Backup verification pending',
  });
  return null;
}

export function createBackupVerificationJobHandler({
  submitRequest,
  readStatus,
  wait = defaultWait,
  pollIntervalMs = 1_000,
  maxPolls = 8 * 60,
}: Dependencies) {
  const boundedPollInterval = boundedInteger(pollIntervalMs, 250, 10_000, 'Poll interval');
  const boundedMaxPolls = boundedInteger(maxPolls, 1, 900, 'Maximum polls');

  return async function executeBackupVerification(
    payload: BackupVerificationPayload,
    context: BackupVerificationContext,
  ) {
    await submitRequest({
      schemaVersion: 1,
      requestId: payload.requestId,
      requestedAt: payload.requestedAt,
    });
    await context.reportProgress({ percent: 5, message: 'Backup verification requested' });

    for (let poll = 0; poll < boundedMaxPolls; poll += 1) {
      context.signal?.throwIfAborted();
      const status = await readStatus();
      const result = await evaluateStatus(status, payload.requestId, context);
      if (result) return result;
      await wait(boundedPollInterval, context.signal);
    }

    throw new BackupVerificationJobError('VERIFICATION_POLL_TIMEOUT');
  };
}
