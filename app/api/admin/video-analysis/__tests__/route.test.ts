/** @jest-environment node */
jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: jest.fn() } }));
jest.mock('@/lib/manual-categorization/service', () => ({
  readCategorization: jest.fn(), saveCategorization: jest.fn(),
  CategorizationError: class extends Error { constructor(public readonly code: string) { super(code); } },
}));
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { CategorizationError, readCategorization, saveCategorization } from '@/lib/manual-categorization/service';
import { GET, POST } from '../route';

const audit = { succeeded: jest.fn(), denied: jest.fn(), failed: jest.fn() };
const body = { movieId: 'movie-1', version: 0, categoryIds: ['forest'], segments: [], complete: true };
const request = (payload = body) => new Request('http://localhost/api/admin/video-analysis', { method: 'POST', body: JSON.stringify(payload) });
beforeEach(() => { jest.clearAllMocks(); jest.mocked(isCurrentUserAdmin).mockResolvedValue(true); jest.mocked(adminMutationAudit.begin).mockReturnValue(audit as never); jest.mocked(readCategorization).mockResolvedValue({ movie: null, remaining: 0 }); });
it('protects read and write access before disclosing content', async () => {
  jest.mocked(isCurrentUserAdmin).mockResolvedValue(false);
  expect((await GET(new Request('http://localhost/api/admin/video-analysis'))).status).toBe(403);
  expect((await POST(request())).status).toBe(403);
  expect(readCategorization).not.toHaveBeenCalled(); expect(saveCategorization).not.toHaveBeenCalled();
});
it('returns uncached random content and forwards an excluded video', async () => {
  const response = await GET(new Request('http://localhost/api/admin/video-analysis?exclude=movie-1'));
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(readCategorization).toHaveBeenCalledWith({ exclude: 'movie-1' });
});
it('rejects the removed model-job payload and malformed JSON', async () => {
  expect((await POST(request({ movieId: 'movie-1', force: true } as never))).status).toBe(400);
  expect((await POST(new Request('http://localhost/api/admin/video-analysis', { method: 'POST', body: '{' }))).status).toBe(400);
  expect(saveCategorization).not.toHaveBeenCalled();
});
it('audits assignment changes without recording private labels or timestamps', async () => {
  jest.mocked(saveCategorization).mockResolvedValue({ movie: null, remaining: 0 });
  expect((await POST(request())).status).toBe(200);
  expect(saveCategorization).toHaveBeenCalledWith(body);
  expect(audit.succeeded).toHaveBeenCalledWith({ target: { type: 'content', id: 'movie-1' }, metadata: { changedFields: ['categories', 'categorySegments', 'categoryReviewedAt'] } });
});
it('returns conflicts without leaking database details', async () => {
  jest.mocked(saveCategorization).mockRejectedValue(new CategorizationError('CONFLICT'));
  const response = await POST(request());
  expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: 'CONFLICT' });
});
