/** @jest-environment node */

import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  BackupVerificationBusyError,
  BackupVerificationStatusError,
  parseBackupVerificationStatus,
  readBackupVerificationStatus,
  parseScheduledBackupStatus,
  readScheduledBackupStatus,
  requestBackupVerification,
} from '@/lib/backup-verification';

const scheduledStatus = {
  schemaVersion: 1,
  environment: 'staging',
  backupName: 'scheduled-staging-20260820T031500Z.dump',
  status: 'VERIFIED',
  diagnosticCode: 'BACKUP_VERIFIED',
  checksumSha256: 'b'.repeat(64),
  completedAt: '2026-08-20T03:15:42.000Z',
};

const verifiedStatus = {
  schemaVersion: 1,
  requestId: 'request-1',
  backupName: 'pre-1.12.0.dump',
  status: 'VERIFIED',
  format: 'pg-custom',
  sizeBytes: 4096,
  checksumSha256: 'a'.repeat(64),
  sourcePostgresVersion: '18.4',
  dumpToolVersion: '18.4',
  verificationPostgresVersion: '18.4',
  startedAt: '2026-08-15T10:00:00.000Z',
  completedAt: '2026-08-15T10:00:05.000Z',
  diagnosticCode: 'VERIFICATION_SUCCEEDED',
  checks: {
    publicTableCount: 24,
    migrationCount: 7,
    userCount: 3,
    contentCount: 308,
  },
};

describe('PostgreSQL backup verification contract', () => {
  it('accepts only bounded scheduled-backup status metadata', () => {
    expect(parseScheduledBackupStatus(scheduledStatus)).toEqual(scheduledStatus);
    expect(() => parseScheduledBackupStatus({
      ...scheduledStatus,
      backupName: '../production.dump',
    })).toThrow(BackupVerificationStatusError);
    expect(() => parseScheduledBackupStatus({
      ...scheduledStatus,
      environment: 'development',
    })).toThrow(BackupVerificationStatusError);
  });

  it('reads scheduled status only from a bounded regular file', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-scheduled-backup-'));
    const statusPath = path.join(directory, 'latest.json');
    try {
      await expect(readScheduledBackupStatus(statusPath)).resolves.toBeNull();
      await writeFile(statusPath, JSON.stringify(scheduledStatus));
      await expect(readScheduledBackupStatus(statusPath)).resolves.toEqual(scheduledStatus);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('accepts a bounded successful isolated-restore result', () => {
    expect(parseBackupVerificationStatus(verifiedStatus)).toEqual(verifiedStatus);
  });

  it.each([
    ['CORRUPT', 'ARCHIVE_CORRUPT'],
    ['TRUNCATED', 'ARCHIVE_TRUNCATED'],
    ['INCOMPATIBLE', 'POSTGRES_VERSION_INCOMPATIBLE'],
    ['TIMEOUT', 'RESTORE_TIMEOUT'],
    ['FAILED', 'SCHEMA_CHECK_FAILED'],
  ])('preserves the distinct %s result without accepting raw diagnostics', (status, diagnosticCode) => {
    const parsed = parseBackupVerificationStatus({
      ...verifiedStatus,
      status,
      diagnosticCode,
      diagnostics: 'postgresql://admin:password@database/Netflix',
      checks: null,
    });

    expect(parsed.status).toBe(status);
    expect(parsed.diagnosticCode).toBe(diagnosticCode);
    expect(JSON.stringify(parsed)).not.toContain('password');
    expect(parsed.checks).toBeNull();
  });

  it('rejects malformed or unbounded status records', () => {
    expect(() => parseBackupVerificationStatus({ ...verifiedStatus, backupName: '../live.dump' }))
      .toThrow(BackupVerificationStatusError);
    expect(() => parseBackupVerificationStatus({ ...verifiedStatus, checksumSha256: 'invalid' }))
      .toThrow(BackupVerificationStatusError);
    expect(() => parseBackupVerificationStatus({ ...verifiedStatus, status: 'UNKNOWN' }))
      .toThrow(BackupVerificationStatusError);
  });

  it('reads only a bounded regular status file', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-backup-verification-'));
    const statusPath = path.join(directory, 'latest.json');
    const targetPath = path.join(directory, 'target.json');

    try {
      await expect(readBackupVerificationStatus(statusPath)).resolves.toBeNull();
      await writeFile(statusPath, JSON.stringify(verifiedStatus));
      await expect(readBackupVerificationStatus(statusPath)).resolves.toEqual(verifiedStatus);

      await writeFile(targetPath, JSON.stringify(verifiedStatus));
      await rm(statusPath);
      await symlink(targetPath, statusPath);
      await expect(readBackupVerificationStatus(statusPath)).rejects.toBeInstanceOf(
        BackupVerificationStatusError,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('publishes one atomic manual request and rejects concurrent requests', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-backup-request-'));
    const requestPath = path.join(directory, 'request.json');

    try {
      const request = {
        schemaVersion: 1 as const,
        requestId: '4d64fa08-b73d-4cdf-91f4-5a9679c31d1f',
        requestedAt: '2026-08-15T10:15:00.000Z',
      };
      await requestBackupVerification(request, requestPath);
      expect(JSON.parse(await readFile(requestPath, 'utf8'))).toEqual(request);

      await expect(requestBackupVerification({
        ...request,
        requestId: 'cd7cf2cb-2ce8-4cd2-af1d-9a129803ea99',
      }, requestPath)).rejects.toBeInstanceOf(BackupVerificationBusyError);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
