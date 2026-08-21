jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      status: init?.status ?? 200,
      headers: { get: (name: string) => init?.headers?.[name] ?? null },
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/admin-audit-reader', () => ({
  adminAuditReader: { search: jest.fn() },
}));

import { GET } from '../route';
import { adminAuditReader } from '@/lib/admin-audit-reader';
import { AdminAuditReadAuthorizationError } from '@/lib/administration/admin-audit-reader';

const search = adminAuditReader.search as jest.Mock;
const request = (url: string) => ({ url }) as Request;

describe('GET /api/admin/audit', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns a filtered audit page without allowing caches to retain it', async () => {
    search.mockResolvedValue({ events: [], total: 0, page: 2, pageSize: 25, totalPages: 0 });

    const response = await GET(request(
      'http://localhost/api/admin/audit?page=2&pageSize=25&actor=Niklas&action=content.publish&targetType=content&outcome=SUCCEEDED&from=2026-08-01&to=2026-08-14',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({
      events: [], total: 0, page: 2, pageSize: 25, totalPages: 0, retentionDays: 365,
    });
    expect(search).toHaveBeenCalledWith({
      page: '2',
      pageSize: '25',
      actor: 'Niklas',
      action: 'content.publish',
      targetType: 'content',
      outcome: 'SUCCEEDED',
      from: '2026-08-01',
      to: '2026-08-14',
    });
  });

  it('returns a sanitized denial and unexpected error', async () => {
    search.mockRejectedValueOnce(new AdminAuditReadAuthorizationError());
    const denied = await GET(request('http://localhost/api/admin/audit'));
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toEqual({ error: 'Forbidden' });

    search.mockRejectedValueOnce(new Error('database details'));
    const failed = await GET(request('http://localhost/api/admin/audit'));
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({ error: 'Unable to load audit events.' });
  });
});
