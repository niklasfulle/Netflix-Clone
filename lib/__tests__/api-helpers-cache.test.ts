/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { movie: { findMany: jest.fn() }, movieWatchTime: { findMany: jest.fn() } } }));
jest.mock('@/lib/redis/runtime', () => ({ getRedisRuntime: jest.fn() }));

import { db } from '@/lib/db';
import { getRedisRuntime } from '@/lib/redis/runtime';
import { getMoviesWithWatchTime } from '../api-helpers';

it.each([
  null, {}, [null], [{ id: 1 }], [{ id: 'movie', title: 1 }],
  [{ id: 'movie', title: 'Film', createdAt: 42, actors: [] }],
  [{ id: 'movie', title: 'Film', actors: null }],
  [{ id: 'movie', title: 'Film', actors: [null] }],
  [{ id: 'movie', title: 'Film', actors: [{ actor: null }] }],
  [{ id: 'movie', title: 'Film', actors: [{ actor: { name: 42 } }] }],
].map(cached => ({ cached })))('replaces invalid cached catalog metadata with durable source data: %#', async ({ cached }) => {
  const set = jest.fn();
  jest.mocked(getRedisRuntime).mockReturnValue({
    key: jest.fn(() => 'catalog-cache'),
    get: jest.fn(async (_key, decode) => {
      try { return { status: 'ok', value: decode(cached) }; }
      catch { return { status: 'error', reason: 'invalid-data' }; }
    }), set,
  } as never);
  jest.mocked(db.movie.findMany).mockResolvedValue([{ id: 'fresh', title: 'Current title', actors: [] }] as never);
  jest.mocked(db.movieWatchTime.findMany).mockResolvedValue([]);
  const result = await getMoviesWithWatchTime('Movie', 'user', 'profile');
  expect(result.movies).toEqual([{ id: 'fresh', title: 'Current title', actors: [] }]);
  expect(set).toHaveBeenCalledWith('catalog-cache', result.movies, { ttlSeconds: 300 });
});
