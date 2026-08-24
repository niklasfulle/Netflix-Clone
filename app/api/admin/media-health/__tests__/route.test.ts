/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn() },
}));
jest.mock('@/lib/media-health', () => ({
  mediaHealthReader: { read: jest.fn() },
}));
jest.mock('@/lib/jobs/runtime', () => ({
  backgroundJobSubmission: { submit: jest.fn() },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { mediaHealthReader } from '@/lib/media-health';
import { GET, POST } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedRead = mediaHealthReader.read as jest.MockedFunction<typeof mediaHealthReader.read>;
const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedSubmit = backgroundJobSubmission.submit as jest.MockedFunction<typeof backgroundJobSubmission.submit>;
const mockedBeginAudit = adminMutationAudit.begin as jest.MockedFunction<typeof adminMutationAudit.begin>;

function auditAttempt() {
  return {
    correlationId: 'correlation-1',
    succeeded: jest.fn().mockResolvedValue(undefined),
    denied: jest.fn().mockResolvedValue(undefined),
    failed: jest.fn().mockResolvedValue(undefined),
  };
}

describe('administrator media health API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedCurrentUser.mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' } as Awaited<ReturnType<typeof currentUser>>);
  });

  it('rejects non-admin reads without querying scan results', async () => {
    mockedIsAdmin.mockResolvedValue(false);

    const response = await GET(new Request('http://localhost/api/admin/media-health'));

    expect(response.status).toBe(403);
    expect(mockedRead).not.toHaveBeenCalled();
  });

  it('returns an uncached filtered overview to administrators', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedRead.mockResolvedValue({
      availability: 'AVAILABLE',
      stale: false,
      runningScan: null,
      lastScan: null,
      findings: [],
      total: 0,
    });

    const response = await GET(new Request(
      'http://localhost/api/admin/media-health?severity=CRITICAL&resourceKind=VIDEO&contentType=Movie',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mockedRead).toHaveBeenCalledWith({
      severity: 'CRITICAL',
      resourceKind: 'VIDEO',
      contentType: 'Movie',
      scanStatus: undefined,
    });
  });

  it('records a denied audit event when a non-admin starts a scan', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(false);
    mockedCurrentUser.mockResolvedValue(undefined);

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(403);
    expect(audit.denied).toHaveBeenCalled();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('returns after atomically accepting a scan job and records correlated success', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(true);
    mockedSubmit.mockResolvedValue({
      id: 'job-run-123',
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'QUEUED',
      duplicate: false,
      correlationId: 'correlation-1',
    });

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ jobRunId: 'job-run-123', status: 'QUEUED', correlationId: 'correlation-1' });
    expect(audit.succeeded).toHaveBeenCalledWith({
      target: { type: 'background_job', id: 'job-run-123' },
      metadata: { scope: 'CATALOG', itemCount: 0 },
    });
  });

  it('returns an existing accepted job for an idempotent retry', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(true);
    mockedSubmit.mockResolvedValue({
      id: 'job-run-123',
      queueJobId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'RUNNING',
      duplicate: true,
      correlationId: 'correlation-1',
    });

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ jobRunId: 'job-run-123', duplicate: true });
  });

  it('rejects malformed content scan input before starting the scanner', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(true);

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({ contentId: '../movie' }),
    }));

    expect(response.status).toBe(400);
    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(audit.failed).toHaveBeenCalledWith({ metadata: { scope: 'CONTENT', itemCount: 0 } });
  });
});
