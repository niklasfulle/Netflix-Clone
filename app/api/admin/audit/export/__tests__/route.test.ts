jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    status: number;
    headers: { get(name: string): string | null };
    private readonly body: string;

    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = { get: (name) => init?.headers?.[name] ?? null };
    }

    async text() { return this.body; }
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

describe('GET /api/admin/audit/export', () => {
  beforeEach(() => jest.resetAllMocks());

  it('uses the shared filters and exports at most one bounded page', async () => {
    search.mockResolvedValue({ events: [], total: 101, page: 1, pageSize: 100, totalPages: 2 });

    const response = await GET(request(
      'http://localhost/api/admin/audit/export?page=9&actor=Niklas&action=content.publish&from=2026-08-01',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Export-Limit')).toBe('100');
    expect(response.headers.get('X-Export-Truncated')).toBe('true');
    expect(response.headers.get('Content-Disposition')).toContain('admin-audit-');
    expect(await response.text()).toContain('Created At,Actor,Actor ID');
    expect(search).toHaveBeenCalledWith({
      page: '1',
      pageSize: '100',
      actor: 'Niklas',
      action: 'content.publish',
      from: '2026-08-01',
    });
  });

  it('uses the same administrator denial as the on-screen query', async () => {
    search.mockRejectedValue(new AdminAuditReadAuthorizationError());

    const response = await GET(request('http://localhost/api/admin/audit/export'));

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Forbidden');
  });
});
