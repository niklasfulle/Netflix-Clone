/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { adminAuditEvent: { create: jest.fn() } } }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/jobs/runtime', () => ({
  backgroundJobSubmission: { submit: jest.fn() },
}));
jest.mock('@/lib/operations/runtime', () => ({
  operationalLeases: {
    execute: jest.fn(async (_options, work) => work({
      fencingToken: BigInt(1),
      resourceKey: 'resource:test',
      expiresAt: () => new Date('2026-08-24T18:00:30.000Z'),
      renew: jest.fn(),
      assertCurrent: jest.fn(),
    })),
  },
}));
jest.mock('@/lib/backup-verification', () => {
  const actual = jest.requireActual('@/lib/backup-verification');
  return {
    ...actual,
    readBackupVerificationStatus: jest.fn(),
    readScheduledBackupStatus: jest.fn(),
  };
});

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import {
  readBackupVerificationStatus,
  readScheduledBackupStatus,
} from '@/lib/backup-verification';
import { db } from '@/lib/db';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { OperationalLeaseUnavailableError } from '@/lib/operations/lease';
import { operationalLeases } from '@/lib/operations/runtime';
import { GET, POST } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedReadStatus = readBackupVerificationStatus as jest.MockedFunction<
  typeof readBackupVerificationStatus
>;
const mockedReadScheduledStatus = readScheduledBackupStatus as jest.MockedFunction<
  typeof readScheduledBackupStatus
>;
const mockedExecute = operationalLeases.execute as jest.MockedFunction<
  typeof operationalLeases.execute
>;
const mockedSubmit = backgroundJobSubmission.submit as jest.MockedFunction<
  typeof backgroundJobSubmission.submit
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
    mockedExecute.mockImplementation(async (_options, work) => work({
      fencingToken: BigInt(1),
      resourceKey: 'resource:test',
      expiresAt: () => new Date('2026-08-24T18:00:30.000Z'),
      renew: jest.fn(),
      assertCurrent: jest.fn(),
    }));
  });

  it('does not disclose verification state to a regular user', async () => {
    mockedIsAdmin.mockResolvedValue(false);

    expect((await GET()).status).toBe(403);
    expect((await POST()).status).toBe(403);
    expect(mockedReadStatus).not.toHaveBeenCalled();
    expect(mockedSubmit).not.toHaveBeenCalled();
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

  it('accepts one durable verification job and audits the job identifier', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedSubmit.mockResolvedValue({
      id: 'backup-job-run-123',
      queueJobId: '650e8400-e29b-41d4-a716-446655440000',
      status: 'QUEUED',
      duplicate: false,
      correlationId: 'request-correlation-123',
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({ jobRunId: 'backup-job-run-123', status: 'QUEUED' });
    expect(mockedSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'backup.verification.request',
      version: 1,
      payload: expect.objectContaining({ scope: 'latest', requestId: expect.any(String) }),
      actor: { userId: 'admin-1', role: 'ADMIN' },
      target: { type: 'backup', id: 'latest' },
    }));
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'backup.verify',
        targetType: 'background_job',
        targetId: 'backup-job-run-123',
        outcome: 'SUCCEEDED',
        metadata: { source: 'manual' },
      }),
    });
  });

  it('returns an already accepted verification job for an idempotent retry', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedSubmit.mockResolvedValue({
      id: 'backup-job-run-123',
      queueJobId: '650e8400-e29b-41d4-a716-446655440000',
      status: 'RUNNING',
      duplicate: true,
      correlationId: 'request-correlation-123',
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      jobRunId: 'backup-job-run-123',
      duplicate: true,
    });
  });

  it('rejects a verification request while the protected resource is leased', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedExecute.mockRejectedValueOnce(new OperationalLeaseUnavailableError('backup.verify'));

    const response = await POST();

    expect(response.status).toBe(409);
    expect(mockedSubmit).not.toHaveBeenCalled();
  });
});
