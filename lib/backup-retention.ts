import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_REQUEST_PATH = '/backup-status/retention/request.json';
const DEFAULT_STATUS_PATH = '/backup-status/retention/latest.json';
const MAX_STATUS_BYTES = 16 * 1024;

export type BackupRetentionRequest = {
  schemaVersion: 1;
  requestId: string;
  requestedAt: string;
  environment: 'staging' | 'production';
};

export type BackupRetentionStatus = {
  schemaVersion: 1;
  requestId: string | null;
  environment: 'staging' | 'production';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BUSY';
  diagnosticCode: 'RETENTION_RUNNING' | 'RETENTION_COMPLETED' | 'LOCK_TIMEOUT'
    | 'RETENTION_FAILED' | 'INVALID_REQUEST' | 'ENVIRONMENT_MISMATCH';
  retainedCount: number | null;
  removedCount: number | null;
  completedAt: string | null;
};

export class BackupRetentionStatusError extends Error {
  constructor() {
    super('Backup retention status is unavailable or invalid');
    this.name = 'BackupRetentionStatusError';
  }
}

export class BackupRetentionBusyError extends Error {
  constructor() {
    super('A backup retention request is already pending');
    this.name = 'BackupRetentionBusyError';
  }
}

function isCount(value: unknown): value is number | null {
  return value === null
    || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000);
}

function isRequestId(value: unknown): value is string | null {
  return value === null || (typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function parseBackupRetentionStatus(value: unknown): BackupRetentionStatus {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BackupRetentionStatusError();
  }
  const record = value as Record<string, unknown>;
  const statuses = new Set(['RUNNING', 'COMPLETED', 'FAILED', 'BUSY']);
  const diagnostics = new Set([
    'RETENTION_RUNNING',
    'RETENTION_COMPLETED',
    'LOCK_TIMEOUT',
    'RETENTION_FAILED',
    'INVALID_REQUEST',
    'ENVIRONMENT_MISMATCH',
  ]);
  const validCompletedAt = record.completedAt === null
    || (typeof record.completedAt === 'string' && !Number.isNaN(Date.parse(record.completedAt)));
  if (
    record.schemaVersion !== 1
    || !isRequestId(record.requestId)
    || (record.environment !== 'staging' && record.environment !== 'production')
    || !statuses.has(String(record.status))
    || !diagnostics.has(String(record.diagnosticCode))
    || !isCount(record.retainedCount)
    || !isCount(record.removedCount)
    || !validCompletedAt
    || (record.status === 'COMPLETED'
      && (record.retainedCount === null || record.removedCount === null || record.completedAt === null))
  ) {
    throw new BackupRetentionStatusError();
  }
  return record as BackupRetentionStatus;
}

export async function readBackupRetentionStatus(
  statusPath = process.env.BACKUP_RETENTION_STATUS_PATH || DEFAULT_STATUS_PATH,
): Promise<BackupRetentionStatus | null> {
  let metadata;
  try {
    metadata = await fs.lstat(statusPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new BackupRetentionStatusError();
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_STATUS_BYTES) {
    throw new BackupRetentionStatusError();
  }
  try {
    return parseBackupRetentionStatus(JSON.parse(await fs.readFile(statusPath, 'utf8')));
  } catch (error) {
    if (error instanceof BackupRetentionStatusError) throw error;
    throw new BackupRetentionStatusError();
  }
}

function validateRequest(request: BackupRetentionRequest): void {
  if (
    request.schemaVersion !== 1
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.requestId)
    || Number.isNaN(Date.parse(request.requestedAt))
    || (request.environment !== 'staging' && request.environment !== 'production')
  ) {
    throw new BackupRetentionStatusError();
  }
}

export async function requestBackupRetention(
  request: BackupRetentionRequest,
  requestPath = process.env.BACKUP_RETENTION_REQUEST_PATH || DEFAULT_REQUEST_PATH,
): Promise<void> {
  validateRequest(request);
  const directory = path.dirname(requestPath);
  const temporaryPath = `${requestPath}.${request.requestId}.tmp`;
  await fs.mkdir(directory, { recursive: true, mode: 0o750 });

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(request)}\n`, {
      encoding: 'utf8',
      mode: 0o640,
      flag: 'wx',
    });
    await fs.link(temporaryPath, requestPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new BackupRetentionBusyError();
    }
    throw error;
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }

  await fs.access(requestPath, fsConstants.R_OK);
}
