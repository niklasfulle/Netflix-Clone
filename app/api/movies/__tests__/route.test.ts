/** @jest-environment node */

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: { findFirst: jest.fn() },
    movie: { findMany: jest.fn() },
    movieWatchTime: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/redis/runtime', () => ({
  getRedisRuntime: jest.fn(),
}));

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getRedisRuntime, type RedisRuntime } from '@/lib/redis/runtime';
import { GET } from '../route';
import { GET as GET_SERIES } from '../../series/route';

const mockedCurrentUser = currentUser as jest.Mock;
const mockedFindProfile = db.profil.findFirst as jest.Mock;
const mockedFindMovies = db.movie.findMany as jest.Mock;
const mockedFindWatchTimes = db.movieWatchTime.findMany as jest.Mock;
const mockedGetRedisRuntime = getRedisRuntime as jest.Mock;
let mockedRedisRuntime: RedisRuntime;

function movie(title: string, type = 'Movie') {
  return {
    id: 'movie-1',
    title,
    description: 'Description',
    type,
    genre: 'Drama',
    duration: '90 min',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    actors: [{ actor: { name: 'Actor One' } }],
  };
}

describe('movies catalog cache', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockedFindProfile.mockResolvedValue({ id: 'profile-1' });

    const values = new Map<string, unknown>();
    mockedRedisRuntime = {
      key: jest.fn(() => 'catalog-key'),
      get: jest.fn(async (key: string, decode: (value: unknown) => unknown) => ({
        status: 'ok',
        value: values.has(key) ? decode(values.get(key)) : null,
        latencyMs: 1,
      })),
      set: jest.fn(async (key: string, value: unknown) => {
        values.set(key, JSON.parse(JSON.stringify(value)));
        return { status: 'ok', value: true, latencyMs: 1 };
      }),
    } as unknown as RedisRuntime;
    mockedGetRedisRuntime.mockReturnValue(mockedRedisRuntime);
  });

  it('keeps shared metadata cached while returning current profile progress', async () => {
    mockedFindMovies
      .mockResolvedValueOnce([movie('Cached title')])
      .mockResolvedValueOnce([movie('New database title')]);
    mockedFindWatchTimes
      .mockResolvedValueOnce([{ movieId: 'movie-1', time: 10 }])
      .mockResolvedValueOnce([{ movieId: 'movie-1', time: 20 }]);

    const firstResponse = await GET();
    const secondResponse = await GET();

    expect(await firstResponse.json()).toEqual([
      expect.objectContaining({ title: 'Cached title', watchTime: 10 }),
    ]);
    expect(mockedRedisRuntime.set).toHaveBeenCalledWith(
      'catalog-key',
      expect.any(Array),
      { ttlSeconds: 300 },
    );
    expect(await secondResponse.json()).toEqual([
      expect.objectContaining({ title: 'Cached title', watchTime: 20 }),
    ]);
  });

  it('keeps shared series metadata cached for the same profile-independent window', async () => {
    mockedFindMovies
      .mockResolvedValueOnce([movie('Cached series', 'Serie')])
      .mockResolvedValueOnce([movie('New database series', 'Serie')]);
    mockedFindWatchTimes.mockResolvedValue([]);

    const firstResponse = await GET_SERIES();
    const secondResponse = await GET_SERIES();

    expect(await firstResponse.json()).toEqual([
      expect.objectContaining({ title: 'Cached series', type: 'Serie' }),
    ]);
    expect(await secondResponse.json()).toEqual([
      expect.objectContaining({ title: 'Cached series', type: 'Serie' }),
    ]);
  });

  it('serves PostgreSQL data when Redis cannot be read', async () => {
    (mockedRedisRuntime.get as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
    mockedFindMovies.mockResolvedValue([movie('PostgreSQL title')]);
    mockedFindWatchTimes.mockResolvedValue([{ movieId: 'movie-1', time: 15 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ title: 'PostgreSQL title', watchTime: 15 }),
    ]);
  });

  it('serves PostgreSQL data when Redis cannot be written', async () => {
    (mockedRedisRuntime.set as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
    mockedFindMovies.mockResolvedValue([movie('PostgreSQL title')]);
    mockedFindWatchTimes.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ title: 'PostgreSQL title' }),
    ]);
  });

  it('repairs invalid cached metadata from PostgreSQL', async () => {
    (mockedRedisRuntime.get as jest.Mock).mockResolvedValueOnce({
      status: 'error',
      reason: 'invalid-data',
      latencyMs: 1,
    });
    mockedFindMovies
      .mockResolvedValueOnce([movie('Repaired title')])
      .mockResolvedValueOnce([movie('New database title')]);
    mockedFindWatchTimes.mockResolvedValue([]);

    const repairedResponse = await GET();
    const cachedResponse = await GET();

    expect(await repairedResponse.json()).toEqual([
      expect.objectContaining({ title: 'Repaired title' }),
    ]);
    expect(await cachedResponse.json()).toEqual([
      expect.objectContaining({ title: 'Repaired title' }),
    ]);
  });
});
