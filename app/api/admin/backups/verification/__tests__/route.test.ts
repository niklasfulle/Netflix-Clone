/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { adminAuditEvent: { create: jest.fn() } } }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/backup-verification', () => {
  const actual = jest.requireActual('@/lib/backup-verification');
  return {
    ...actual,
    readBackupVerificationStatus: jest.fn(),
    readScheduledBackupStatus: jest.fn(),
    requestBackupVerification: jest.fn(),
  };
});

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import {
  BackupVerificationBusyError,
  readBackupVerificationStatus,
  readScheduledBackupStatus,
  requestBackupVerification,
} from '@/lib/backup-verification';
import { db } from '@/lib/db';
import { GET, POST } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedReadStatus = readBackupVerificationStatus as jest.MockedFunction<
  typeof readBackupVerificationStatus
>;
const mockedReadScheduledStatus = readScheduledBackupStatus as jest.MockedFunction<
  typeof readScheduledBackupStatus
>;
const mockedRequestVerification = requestBackupVerification as jest.MockedFunction<
  typeof requestBackupVerification
>;

const verifiedStatus = {
  schemaVersion: 1 as const,
  requestId: 'request-1',
  backupName: 'pre-1.12.0.dump',
  status: 'VERIFIED' as const,
  format: 'pg-custom' as const,
  sizeBytes: 4096,
  checksumSha256: 'a'.repeat(64),
  sourcePostgresVersion: '18.4',
  dumpToolVersion: '18.4',
  verificationPostgresVersion: '18.4',
  startedAt: '2026-08-15T10:00:00.000Z',
  completedAt: '2026-08-15T10:00:05.000Z',
  diagnosticCode: 'VERIFICATION_SUCCEEDED' as const,
  checks: { publicTableCount: 24, migrationCount: 7, userCount: 3, contentCount: 308 },
};

describe('administrator PostgreSQL backup verification API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockedReadScheduledStatus.mockResolvedValue(null);
  });

  it('does not disclose verification state to a regular user', async () => {
    mockedIsAdmin.mockResolvedValue(false);

    expect((await GET()).status).toBe(403);
    expect((await POST()).status).toBe(403);
    expect(mockedReadStatus).not.toHaveBeenCalled();
    expect(mockedRequestVerification).not.toHaveBeenCalled();
  });

  it('returns the bounded last-known verification state to an administrator', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedReadStatus.mockResolvedValue(verifiedStatus);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: verifiedStatus, scheduled: null });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns the last scheduled backup result beside restore evidence', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedReadStatus.mockResolvedValue(verifiedStatus);
    mockedReadScheduledStatus.mockResolvedValue({
      schemaVersion: 1,
      environment: 'staging',
      backupName: 'scheduled-staging-20260820T031500Z.dump',
      status: 'VERIFIED',
      diagnosticCode: 'BACKUP_VERIFIED',
      checksumSha256: 'b'.repeat(64),
      completedAt: '2026-08-20T03:15:42.000Z',
    });

    const response = await GET();
    expect(await response.json()).toMatchObject({
      scheduled: {
        environment: 'staging',
        status: 'VERIFIED',
        diagnosticCode: 'BACKUP_VERIFIED',
      },
    });
  });

  it('accepts one manual verification request and audits the request identifier', async () => {
    mockedIsAdmin.mockResolvedValue(true);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ accepted: true, requestId: expect.any(String) });
    expect(mockedRequestVerification).toHaveBeenCalledWith({
      schemaVersion: 1,
      requestId: body.requestId,
      requestedAt: expect.any(String),
    });
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'backup.verify',
        targetType: 'backup',
        targetId: body.requestId,
        outcome: 'SUCCEEDED',
        metadata: { source: 'manual' },
      }),
    });
  });

  it('rejects a concurrent request with a controlled conflict', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedRequestVerification.mockRejectedValue(new BackupVerificationBusyError());

    const response = await POST();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'A backup verification is already pending.',
    });
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'backup.verify', outcome: 'FAILED' }),
    });
  });
});
