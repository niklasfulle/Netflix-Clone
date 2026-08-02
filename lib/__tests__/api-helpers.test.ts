/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    actor: { findMany: jest.fn() },
    movie: { count: jest.fn(), findMany: jest.fn() },
    movieWatchTime: { findMany: jest.fn() },
    profil: { findFirst: jest.fn() },
  },
}));

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';
import {
  getActorNamesForType,
  getActorsWithPagination,
  getMoviesByActor,
  getMoviesWithWatchTime,
  getRandomMovie,
  getUserAndProfile,
  ApiError,
  handleApiError,
  serializeMovie,
  transformMoviesResponse,
} from '../api-helpers';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedDb = db as any;

describe('API helpers', () => {
  beforeEach(() => jest.resetAllMocks());

  it('resolves the current user and active profile', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });

    await expect(getUserAndProfile('route')).resolves.toEqual({
      user: { id: 'user1' }, profil: { id: 'profile1' },
    });
  });

  it('returns authentication and not-found responses for missing users and profiles', async () => {
    mockedCurrentUser.mockResolvedValueOnce(undefined).mockResolvedValue({ id: 'user1' } as any);
    const missingUser = (await getUserAndProfile('route')).error;
    expect(missingUser?.status).toBe(401);
    await expect(missingUser?.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
    });
    mockedDb.profil.findFirst.mockResolvedValue(null);
    expect((await getUserAndProfile('route')).error?.status).toBe(404);
    expect(logBackendAction).toHaveBeenCalledTimes(2);
  });

  it('loads media and watch time with defaults and optional ordering', async () => {
    const movies = [{ id: 'movie1' }, { id: 'movie2' }];
    mockedDb.movie.findMany
      .mockResolvedValueOnce([...movies])
      .mockResolvedValueOnce([...movies]);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([{ movieId: 'movie1', time: 5 }]);

    expect((await getMoviesWithWatchTime('Movie', 'user1', 'profile1')).movies).toEqual([...movies].reverse());
    expect((await getMoviesWithWatchTime('Serie', 'user1', 'profile1', {
      take: 4, orderBy: { title: 'asc' }, where: { genre: 'Drama' }, reverse: false,
    })).movies).toEqual(movies);
  });

  it('transforms media actors and optional watch time', () => {
    const result = transformMoviesResponse([
      {
        id: 'movie1',
        title: 'One',
        videoUrl: 'data:video/mp4;base64,heavy-playback-data',
        thumbnailUrl: 'data:image/jpeg;base64,heavy-thumbnail-data',
        actors: [{ actor: { name: 'A' } }, { actor: { name: 'B' } }],
      },
      { id: 'movie2', title: 'Two', actors: [] },
    ], [{ movieId: 'movie1', time: 12 }]);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'movie1',
        actor: 'A, B',
        thumbnailUrl: '/api/catalog/thumbnails/movie1',
        watchTime: 12,
      }),
      expect.objectContaining({ id: 'movie2', actor: '', watchTime: undefined }),
    ]);
    expect(result[0]).not.toHaveProperty('videoUrl');
  });

  it('loads and transforms media by actor', async () => {
    mockedDb.movie.findMany.mockResolvedValue([{
      id: 'movie1', actors: [{ actor: { name: 'Actor' } }],
    }]);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([]);

    expect(await getMoviesByActor('Movie', 'Actor', 'user1', 'profile1')).toEqual([
      expect.objectContaining({ id: 'movie1', actor: 'Actor' }),
    ]);
    expect(mockedDb.movie.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 12,
      select: expect.not.objectContaining({ videoUrl: true }),
    }));
  });

  it('loads paginated actor names for movies and series', async () => {
    mockedDb.actor.findMany.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);

    expect(await getActorsWithPagination('Movie', 2, 5)).toEqual(['A', 'B']);
    expect(await getActorsWithPagination('Serie', 0, 10)).toEqual(['A', 'B']);
    expect(mockedDb.actor.findMany).toHaveBeenCalledTimes(2);
  });

  it('returns unique, non-empty actor names for a media type', async () => {
    mockedDb.movie.findMany.mockResolvedValue([
      { actors: [{ actor: { name: 'A' } }, { actor: { name: 'A' } }] },
      { actors: [{ actor: { name: 'B' } }, { actor: null }] },
    ]);

    expect(await getActorNamesForType('Movie')).toEqual(['A', 'B']);
  });

  it('returns a random media item or null for empty collections', async () => {
    mockedDb.movie.count.mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce(2);
    mockedDb.movie.findMany.mockResolvedValueOnce([{ id: 'movie1' }]).mockResolvedValueOnce([]);

    await expect(getRandomMovie('Movie')).resolves.toBeNull();
    await expect(getRandomMovie('Movie')).resolves.toEqual({ id: 'movie1' });
    await expect(getRandomMovie('Serie')).resolves.toBeNull();

    const playableMovieFilter = {
      type: 'Movie',
      status: 'PUBLISHED',
      videoUrl: { not: '' },
      thumbnailUrl: { not: '' },
    };
    expect(mockedDb.movie.count).toHaveBeenNthCalledWith(1, {
      where: playableMovieFilter,
    });
    expect(mockedDb.movie.findMany).toHaveBeenNthCalledWith(1, {
      where: playableMovieFilter,
      take: 1,
      skip: expect.any(Number),
    });
  });

  it.each([
    ['VALIDATION_ERROR', 400],
    ['UNAUTHENTICATED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
  ] as const)('maps %s API errors to status %i', async (code, status) => {
    const response = handleApiError(new ApiError(code, 'Safe message'), 'route');
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: { code, message: 'Safe message' } });
  });

  it('hides internal exception details and serializes dates', async () => {
    const error = new Error('failed');
    const response = handleApiError(error, 'route');
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
    expect(logBackendAction).toHaveBeenCalledWith(
      'route_error',
      { errorName: 'Error', code: 'INTERNAL_ERROR' },
      'error',
    );
    expect(serializeMovie({ id: 'movie1', createdAt: new Date('2024-01-01') })).toEqual({
      id: 'movie1', createdAt: '2024-01-01T00:00:00.000Z',
    });
    expect(serializeMovie({ id: 'movie2', createdAt: 'existing' }).createdAt).toBe('existing');
  });
});
