import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';

const STATUS_SCHEMA_VERSION = 1;
const MAX_STATUS_BYTES = 16 * 1024;
const DEFAULT_STATUS_PATH = '/backup-status/verification/latest.json';
const DEFAULT_REQUEST_PATH = '/backup-status/verification/request.json';
const DEFAULT_SCHEDULED_STATUS_PATH = '/backup-status/scheduled/latest.json';

const VERIFICATION_STATUSES = new Set([
  'PENDING',
  'RUNNING',
  'VERIFIED',
  'CORRUPT',
  'TRUNCATED',
  'INCOMPATIBLE',
  'TIMEOUT',
  'FAILED',
  'INTERRUPTED',
  'BUSY',
] as const);

const DIAGNOSTIC_CODES = new Set([
  'VERIFICATION_REQUESTED',
  'VERIFICATION_RUNNING',
  'VERIFICATION_SUCCEEDED',
  'ARCHIVE_CORRUPT',
  'ARCHIVE_TRUNCATED',
  'POSTGRES_VERSION_INCOMPATIBLE',
  'RESTORE_TIMEOUT',
  'RESTORE_FAILED',
  'SCHEMA_CHECK_FAILED',
  'VERIFICATION_INTERRUPTED',
  'VERIFICATION_BUSY',
  'NO_BACKUP_AVAILABLE',
  'VERIFIER_FAILED',
] as const);

export type BackupVerificationStatusName =
  | 'PENDING'
  | 'RUNNING'
  | 'VERIFIED'
  | 'CORRUPT'
  | 'TRUNCATED'
  | 'INCOMPATIBLE'
  | 'TIMEOUT'
  | 'FAILED'
  | 'INTERRUPTED'
  | 'BUSY';

export type BackupVerificationDiagnosticCode =
  | 'VERIFICATION_REQUESTED'
  | 'VERIFICATION_RUNNING'
  | 'VERIFICATION_SUCCEEDED'
  | 'ARCHIVE_CORRUPT'
  | 'ARCHIVE_TRUNCATED'
  | 'POSTGRES_VERSION_INCOMPATIBLE'
  | 'RESTORE_TIMEOUT'
  | 'RESTORE_FAILED'
  | 'SCHEMA_CHECK_FAILED'
  | 'VERIFICATION_INTERRUPTED'
  | 'VERIFICATION_BUSY'
  | 'NO_BACKUP_AVAILABLE'
  | 'VERIFIER_FAILED';

export type BackupVerificationChecks = {
  publicTableCount: number;
  migrationCount: number;
  userCount: number;
  contentCount: number;
};

export type BackupVerificationStatus = {
  schemaVersion: 1;
  requestId: string | null;
  backupName: string | null;
  status: BackupVerificationStatusName;
  format: 'pg-custom' | 'unknown';
  sizeBytes: number | null;
  checksumSha256: string | null;
  sourcePostgresVersion: string | null;
  dumpToolVersion: string | null;
  verificationPostgresVersion: string | null;
  startedAt: string;
  completedAt: string | null;
  diagnosticCode: BackupVerificationDiagnosticCode;
  checks: BackupVerificationChecks | null;
};

export type BackupVerificationRequest = {
  schemaVersion: 1;
  requestId: string;
  requestedAt: string;
};

export type ScheduledBackupStatus = {
  schemaVersion: 1;
  requestId: string | null;
  environment: 'staging' | 'production';
  backupName: string | null;
  status: 'RUNNING' | 'VERIFIED' | 'FAILED';
  diagnosticCode:
    | 'BACKUP_RUNNING'
    | 'BACKUP_VERIFIED'
    | 'LOCK_TIMEOUT'
    | 'BACKUP_TIMEOUT'
    | 'BACKUP_FAILED'
    | 'VERIFICATION_FAILED';
  checksumSha256: string | null;
  completedAt: string | null;
};

export class BackupVerificationStatusError extends Error {
  constructor() {
    super('Backup verification status is unavailable or invalid');
    this.name = 'BackupVerificationStatusError';
  }
}

export class BackupVerificationBusyError extends Error {
  constructor() {
    super('A backup verification request is already pending');
    this.name = 'BackupVerificationBusyError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function nullableBoundedId(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' && /^[0-9A-Za-z_-]{1,128}$/.test(value) ? value : undefined;
}

function nullableBackupName(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string'
    && value.length <= 191
    && /^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$/.test(value)
    ? value
    : undefined;
}

function nullableVersion(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' && /^\d{1,3}(?:\.\d{1,3}){0,3}$/.test(value)
    ? value
    : undefined;
}

function nullableSize(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function nullableChecksum(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function nullableDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  return validDate(value) ? value : undefined;
}

function parseChecks(value: unknown): BackupVerificationChecks | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const keys = ['publicTableCount', 'migrationCount', 'userCount', 'contentCount'] as const;
  if (!keys.every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)) {
    return undefined;
  }
  return {
    publicTableCount: Number(value.publicTableCount),
    migrationCount: Number(value.migrationCount),
    userCount: Number(value.userCount),
    contentCount: Number(value.contentCount),
  };
}

export function parseBackupVerificationStatus(value: unknown): BackupVerificationStatus {
  if (!isRecord(value) || value.schemaVersion !== STATUS_SCHEMA_VERSION) {
    throw new BackupVerificationStatusError();
  }

  const requestId = nullableBoundedId(value.requestId);
  const backupName = nullableBackupName(value.backupName);
  const sizeBytes = nullableSize(value.sizeBytes);
  const checksumSha256 = nullableChecksum(value.checksumSha256);
  const sourcePostgresVersion = nullableVersion(value.sourcePostgresVersion);
  const dumpToolVersion = nullableVersion(value.dumpToolVersion);
  const verificationPostgresVersion = nullableVersion(value.verificationPostgresVersion);
  const completedAt = nullableDate(value.completedAt);
  const checks = parseChecks(value.checks);

  if (
    requestId === undefined
    || backupName === undefined
    || sizeBytes === undefined
    || checksumSha256 === undefined
    || sourcePostgresVersion === undefined
    || dumpToolVersion === undefined
    || verificationPostgresVersion === undefined
    || completedAt === undefined
    || checks === undefined
    || !VERIFICATION_STATUSES.has(value.status as BackupVerificationStatusName)
    || (value.format !== 'pg-custom' && value.format !== 'unknown')
    || !validDate(value.startedAt)
    || !DIAGNOSTIC_CODES.has(value.diagnosticCode as BackupVerificationDiagnosticCode)
  ) {
    throw new BackupVerificationStatusError();
  }

  return {
    schemaVersion: 1,
    requestId,
    backupName,
    status: value.status as BackupVerificationStatusName,
    format: value.format,
    sizeBytes,
    checksumSha256,
    sourcePostgresVersion,
    dumpToolVersion,
    verificationPostgresVersion,
    startedAt: value.startedAt,
    completedAt,
    diagnosticCode: value.diagnosticCode as BackupVerificationDiagnosticCode,
    checks,
  };
}

export function parseScheduledBackupStatus(value: unknown): ScheduledBackupStatus {
  if (!isRecord(value) || value.schemaVersion !== STATUS_SCHEMA_VERSION) {
    throw new BackupVerificationStatusError();
  }
  const backupName = nullableBackupName(value.backupName);
  const checksumSha256 = nullableChecksum(value.checksumSha256);
  const completedAt = nullableDate(value.completedAt);
  const requestId = value.requestId === undefined ? null : nullableBoundedId(value.requestId);
  const statuses = new Set(['RUNNING', 'VERIFIED', 'FAILED']);
  const diagnosticCodes = new Set([
    'BACKUP_RUNNING',
    'BACKUP_VERIFIED',
    'LOCK_TIMEOUT',
    'BACKUP_TIMEOUT',
    'BACKUP_FAILED',
    'VERIFICATION_FAILED',
  ]);
  if (
    (value.environment !== 'staging' && value.environment !== 'production')
    || requestId === undefined
    || backupName === undefined
    || checksumSha256 === undefined
    || completedAt === undefined
    || !statuses.has(String(value.status))
    || !diagnosticCodes.has(String(value.diagnosticCode))
  ) {
    throw new BackupVerificationStatusError();
  }
  return {
    schemaVersion: 1,
    requestId,
    environment: value.environment,
    backupName,
    status: value.status as ScheduledBackupStatus['status'],
    diagnosticCode: value.diagnosticCode as ScheduledBackupStatus['diagnosticCode'],
    checksumSha256,
    completedAt,
  };
}

export async function readBackupVerificationStatus(
  statusPath = process.env.BACKUP_VERIFICATION_STATUS_PATH || DEFAULT_STATUS_PATH,
): Promise<BackupVerificationStatus | null> {
  let metadata;
  try {
    metadata = await fs.lstat(statusPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new BackupVerificationStatusError();
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_STATUS_BYTES) {
    throw new BackupVerificationStatusError();
  }

  try {
    return parseBackupVerificationStatus(JSON.parse(await fs.readFile(statusPath, 'utf8')));
  } catch (error) {
    if (error instanceof BackupVerificationStatusError) throw error;
    throw new BackupVerificationStatusError();
  }
}

export async function readScheduledBackupStatus(
  statusPath = process.env.SCHEDULED_BACKUP_STATUS_PATH || DEFAULT_SCHEDULED_STATUS_PATH,
): Promise<ScheduledBackupStatus | null> {
  let metadata;
  try {
    metadata = await fs.lstat(statusPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new BackupVerificationStatusError();
  }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_STATUS_BYTES) {
    throw new BackupVerificationStatusError();
  }
  try {
    return parseScheduledBackupStatus(JSON.parse(await fs.readFile(statusPath, 'utf8')));
  } catch (error) {
    if (error instanceof BackupVerificationStatusError) throw error;
    throw new BackupVerificationStatusError();
  }
}

function validateRequest(request: BackupVerificationRequest) {
  if (
    request.schemaVersion !== STATUS_SCHEMA_VERSION
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.requestId)
    || !validDate(request.requestedAt)
  ) {
    throw new BackupVerificationStatusError();
  }
}

export async function requestBackupVerification(
  request: BackupVerificationRequest,
  requestPath = process.env.BACKUP_VERIFICATION_REQUEST_PATH || DEFAULT_REQUEST_PATH,
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
      throw new BackupVerificationBusyError();
    }
    throw error;
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }

  await fs.access(requestPath, fsConstants.R_OK);
}
