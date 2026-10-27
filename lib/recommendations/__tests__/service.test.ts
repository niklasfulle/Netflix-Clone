/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/db', () => ({ db: { movie: { findFirst: jest.fn(), findMany: jest.fn() }, actor: { findMany: jest.fn() } } }));
import { db } from '@/lib/db';
import { videoRecommendations } from '../service';

const movie = (id: string, actor = false) => ({ id, title: `Neutral ${id}`, createdAt: new Date(1000), actors: actor ? [{ actorId: 'actor-a' }] : [], categories: [{ categoryId: 'forest' }], categorySegments: [{ categoryId: 'city' }, { categoryId: 'city' }] });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(db.movie.findFirst).mockResolvedValue(movie('current', true) as never);
  jest.mocked(db.actor.findMany).mockResolvedValue([{ movies: [{ movie: movie('actor-one', true) }, { movie: movie('actor-two', true) }] }] as never);
  jest.mocked(db.movie.findMany).mockResolvedValue(Array.from({ length: 8 }, (_, i) => movie(`category-${i}`)) as never);
});
it('selects only published candidates, includes both category scopes and bounds the candidate pools', async () => {
  const result = await videoRecommendations('current');
  expect(result).toHaveLength(6);
  expect(result?.slice(0, 2).map(entry => entry.id)).toEqual(['actor-one', 'actor-two']);
  expect(result?.[0]).toEqual({ id: 'actor-one', title: 'Neutral actor-one', reason: 'same-actor', thumbnailUrl: '/api/catalog/thumbnails/actor-one' });
  expect(db.movie.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'current', status: 'PUBLISHED' } }));
  expect(db.actor.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: { movies: expect.objectContaining({ take: 40, where: { movie: expect.objectContaining({ status: 'PUBLISHED', id: { not: 'current' } }) } }) } }));
  expect(db.movie.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 600, where: expect.objectContaining({ status: 'PUBLISHED', OR: [
    { categories: { some: { categoryId: { in: ['forest', 'city'] } } } },
    { categorySegments: { some: { categoryId: { in: ['forest', 'city'] } } } },
  ] }) }));
});
it('does not disclose or use a missing or unpublished source video', async () => {
  jest.mocked(db.movie.findFirst).mockResolvedValue(null);
  await expect(videoRecommendations('draft')).resolves.toBeNull();
  expect(db.movie.findMany).not.toHaveBeenCalled(); expect(db.actor.findMany).not.toHaveBeenCalled();
});
