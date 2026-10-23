/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    actor: { findMany: jest.fn() },
    movie: { findMany: jest.fn() },
    movieWatchTime: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/api-helpers', () => ({
  getUserAndProfile: jest.fn(),
  transformMoviesResponse: jest.fn(),
  handleApiError: jest.fn((error: unknown) =>
    Response.json({ error: String(error) }, { status: 500 })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { db } from '@/lib/db';
import {
  getUserAndProfile,
  handleApiError,
  transformMoviesResponse,
} from '@/lib/api-helpers';
import { GET } from '../route';

const mockedGetUserAndProfile = getUserAndProfile as jest.Mock;
const mockedFindActors = db.actor.findMany as jest.Mock;
const mockedFindMovies = db.movie.findMany as jest.Mock;
const mockedFindWatchTimes = db.movieWatchTime.findMany as jest.Mock;
const mockedTransformMoviesResponse = transformMoviesResponse as jest.Mock;

function requestFor(searchItem: string) {
  return new Request(`http://localhost/api/search/${encodeURIComponent(searchItem)}`);
}

function movie(title: string, type: string) {
  return {
    id: `${type.toLowerCase()}-1`,
    title,
    description: `${title} description`,
    type,
    actors: [{ actor: { name: 'Actor One' } }],
  };
}

describe('search route', () => {
  it('does not disclose search results after an authentication rejection', async () => {
    mockedGetUserAndProfile.mockResolvedValueOnce({ error: Response.json({ error: 'Unauthorized' }, { status: 401 }) });
    const response = await GET(requestFor('actor'), { params: Promise.resolve({ searchItem: 'actor' }) });
    expect(response.status).toBe(401);
    expect(mockedFindActors).not.toHaveBeenCalled();
    expect(mockedFindMovies).not.toHaveBeenCalled();
  });

  it('uses the common error response for malformed encoded search terms', async () => {
    jest.mocked(handleApiError).mockImplementationOnce(() => Response.json({ error: 'Search unavailable' }, { status: 500 }));
    const response = await GET(requestFor('%E0%A4%A'), { params: Promise.resolve({ searchItem: '%E0%A4%A' }) });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Search unavailable' });
    expect(mockedFindMovies).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NEXT_PUBLIC_TYPE = 'Movie,Serie';
    mockedGetUserAndProfile.mockResolvedValue({
      user: { id: 'user-1' },
      profil: { id: 'profile-1' },
    });
    mockedFindActors.mockResolvedValue([{ id: 'actor-1', name: 'Actor One' }]);
    mockedFindMovies.mockResolvedValue([
      movie('Movie One', 'Movie'),
      movie('Series One', 'Serie'),
    ]);
    mockedFindWatchTimes.mockResolvedValue([{ movieId: 'movie-1', time: 12 }]);
    mockedTransformMoviesResponse.mockImplementation((movies: Array<{ id: string; title: string; type: string }>) =>
      movies.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
      }))
    );
  });

  it('returns no results and does not query the database below three characters', async () => {
    const response = await GET(requestFor('ab'), {
      params: Promise.resolve({ searchItem: 'ab' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      actors: [],
      content: { Movie: [], Serie: [] },
    });
    expect(mockedFindActors).not.toHaveBeenCalled();
    expect(mockedFindMovies).not.toHaveBeenCalled();
  });

  it('groups actor and configured content matches separately', async () => {
    const response = await GET(requestFor('actor'), {
      params: Promise.resolve({ searchItem: 'actor' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      actors: [{ id: 'actor-1', name: 'Actor One' }],
      content: {
        Movie: [{ id: 'movie-1', title: 'Movie One', type: 'Movie' }],
        Serie: [{ id: 'serie-1', title: 'Series One', type: 'Serie' }],
      },
    });
    expect(mockedFindMovies).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ type: { in: ['Movie', 'Serie'] } }),
    }));
  });

  it('uses NEXT_PUBLIC_TYPE to limit and label content groups', async () => {
    process.env.NEXT_PUBLIC_TYPE = 'Serie';
    mockedFindMovies.mockResolvedValue([movie('Series One', 'Serie')]);

    const response = await GET(requestFor('series'), {
      params: Promise.resolve({ searchItem: 'series' }),
    });

    expect(await response.json()).toEqual({
      actors: [{ id: 'actor-1', name: 'Actor One' }],
      content: {
        Serie: [{ id: 'serie-1', title: 'Series One', type: 'Serie' }],
      },
    });
    expect(mockedFindMovies).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ type: { in: ['Serie'] } }),
    }));
  });
});
