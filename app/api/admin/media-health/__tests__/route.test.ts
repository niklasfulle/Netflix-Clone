/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn() },
}));
jest.mock('@/lib/media-health', () => ({
  mediaHealthReader: { read: jest.fn() },
}));
jest.mock('@/lib/media-integrity', () => ({
  mediaIntegrityScanner: { scan: jest.fn() },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { MediaScanAlreadyRunningError } from '@/lib/administration/media-integrity-scanner';
import { mediaHealthReader } from '@/lib/media-health';
import { mediaIntegrityScanner } from '@/lib/media-integrity';
import { GET, POST } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedRead = mediaHealthReader.read as jest.MockedFunction<typeof mediaHealthReader.read>;
const mockedScan = mediaIntegrityScanner.scan as jest.MockedFunction<typeof mediaIntegrityScanner.scan>;
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

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(403);
    expect(audit.denied).toHaveBeenCalled();
    expect(mockedScan).not.toHaveBeenCalled();
  });

  it('returns only after a persisted scan and records correlated success', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(true);
    mockedScan.mockResolvedValue({
      id: 'scan-1',
      scope: 'CATALOG',
      requestedContentId: null,
      status: 'COMPLETED',
      startedAt: new Date('2026-08-14T12:00:00.000Z'),
      completedAt: new Date('2026-08-14T12:00:10.000Z'),
      contentCount: 5,
      findingCount: 1,
      criticalCount: 1,
      warningCount: 0,
      findings: [],
    });

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 'scan-1', status: 'COMPLETED', correlationId: 'correlation-1' });
    expect(audit.succeeded).toHaveBeenCalledWith({
      target: { type: 'media_scan', id: 'scan-1' },
      metadata: { scope: 'CATALOG', itemCount: 5 },
    });
  });

  it('rejects a duplicate running scan and audits the controlled failure', async () => {
    const audit = auditAttempt();
    mockedBeginAudit.mockReturnValue(audit);
    mockedIsAdmin.mockResolvedValue(true);
    mockedScan.mockRejectedValue(new MediaScanAlreadyRunningError('CATALOG'));

    const response = await POST(new Request('http://localhost/api/admin/media-health', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'A matching media scan is already running.',
      correlationId: 'correlation-1',
    });
    expect(audit.failed).toHaveBeenCalledWith({ metadata: { scope: 'CATALOG', itemCount: 0 } });
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
    expect(mockedScan).not.toHaveBeenCalled();
    expect(audit.failed).toHaveBeenCalledWith({ metadata: { scope: 'CONTENT', itemCount: 0 } });
  });
});
