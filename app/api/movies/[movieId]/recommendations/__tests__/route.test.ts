/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/recommendations/service', () => ({ videoRecommendations: jest.fn() }));
import { currentUser } from '@/lib/auth';
import { videoRecommendations } from '@/lib/recommendations/service';
import { GET } from '../route';

const request = new Request('http://localhost/api/movies/current/recommendations');
const context = { params: Promise.resolve({ movieId: 'current' }) };
beforeEach(() => { jest.resetAllMocks(); jest.mocked(currentUser).mockResolvedValue({ id: 'viewer' } as never); });
it('requires authentication before reading catalog matches', async () => {
  jest.mocked(currentUser).mockResolvedValue(undefined);
  expect((await GET(request, context)).status).toBe(401);
  expect(videoRecommendations).not.toHaveBeenCalled();
});
it('returns a private uncached selection for preloading', async () => {
  const items = [{ id: 'next-one', title: 'Forest walk', reason: 'same-actor' as const, thumbnailUrl: '/api/catalog/thumbnails/next-one' }];
  jest.mocked(videoRecommendations).mockResolvedValue(items);
  const response = await GET(request, context);
  expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toEqual({ items });
});
it('does not reveal an unpublished or missing source', async () => {
  jest.mocked(videoRecommendations).mockResolvedValue(null);
  expect((await GET(request, context)).status).toBe(404);
});
it('rejects malformed identifiers without accessing recommendations', async () => {
  expect((await GET(request, { params: Promise.resolve({ movieId: '../private' }) })).status).toBe(404);
  expect(videoRecommendations).not.toHaveBeenCalled();
});
it('returns a bounded error without database details', async () => {
  jest.mocked(videoRecommendations).mockRejectedValue(new Error('internal diagnostic'));
  const response = await GET(request, context);
  expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: 'RECOMMENDATIONS_UNAVAILABLE' });
});
