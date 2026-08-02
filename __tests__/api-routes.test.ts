/** @jest-environment node */

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/admin-auth', () => ({
  isCurrentUserAdmin: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/watch-progress', () => ({
  CONTINUE_WATCHING_MAX_ITEMS: 20,
  getRecentContinueWatchingIds: jest.fn(() => ['movie1']),
}));

jest.mock('@/lib/db', () => ({
  db: {
    actor: { findMany: jest.fn() },
    movie: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    movieView: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    movieWatchTime: { findMany: jest.fn() },
    playlist: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    playlistEntry: { findMany: jest.fn() },
    profil: { count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    profilImg: { findMany: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    watchlist: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/api-helpers', () => ({
  getActorNamesForType: jest.fn(),
  getActorsWithPagination: jest.fn(),
  getMoviesByActor: jest.fn(),
  getMoviesWithWatchTime: jest.fn(),
  getRandomMovie: jest.fn(),
  getUserAndProfile: jest.fn(),
  handleApiError: jest.fn((error: unknown) =>
    Response.json({ error: String(error) }, { status: 500 }),
  ),
  serializeMovie: jest.fn((movie: unknown) => movie),
  transformMoviesResponse: jest.fn((movies: unknown[]) => movies),
}));

import { UserRole } from '@prisma/client';
import { currentRole, currentUser } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import * as apiHelpers from '@/lib/api-helpers';
import { getRecentContinueWatchingIds } from '@/lib/watch-progress';
import { GET as getCurrentUser } from '@/app/api/current/user/route';
import { GET as getCurrentProfile } from '@/app/api/current/profil/route';
import { GET as getProfiles } from '@/app/api/profil/route';
import { GET as getProfileImages } from '@/app/api/profilimg/route';
import { GET as getRandom } from '@/app/api/random/route';
import { GET as getRandomMovie } from '@/app/api/random/movies/route';
import { GET as getRandomSeries } from '@/app/api/random/series/route';
import { GET as getMovies } from '@/app/api/movies/route';
import { GET as getSeries } from '@/app/api/series/route';
import { GET as getMovieActorCount } from '@/app/api/movies/getActorsCount/route';
import { GET as getSeriesActorCount } from '@/app/api/series/getActorsCount/route';
import { GET as getMovieActors } from '@/app/api/movies/getActors/[limit]/route';
import { GET as getSeriesActors } from '@/app/api/series/getActors/[limit]/route';
import { GET as getMoviesByActor } from '@/app/api/movies/moviesByActor/[actor]/route';
import { GET as getSeriesByActor } from '@/app/api/series/seriesByActor/[actor]/route';
import { GET as getMovieViews } from '@/app/api/movies/[movieId]/views/route';
import { GET as getAdmin } from '@/app/api/admin/route';
import { GET as getAdminUsers } from '@/app/api/admin/users/route';
import { POST as blockAdminUser } from '@/app/api/admin/users/block/route';
import { GET as getWatchlist } from '@/app/api/watchlist/route';
import { GET as getAllActors } from '@/app/api/actors/all/route';
import { GET as getNewMovies } from '@/app/api/movies/newMovies/route';
import { GET as getNewMedia } from '@/app/api/movies/new/route';
import { GET as getNewSeries } from '@/app/api/series/newSeries/route';
import { GET as getAllMovies } from '@/app/api/movies/all/route';
import { GET as getAllSeries } from '@/app/api/series/all/route';
import { GET as getAdminMovies } from '@/app/api/movies/admin/route';
import { GET as getRandomMovies } from '@/app/api/movies/random/route';
import { GET as getRandomSeriesCollection } from '@/app/api/series/random/route';
import { GET as getFavorites } from '@/app/api/favorites/route';
import { GET as getFavoriteMovie } from '@/app/api/favorites/[movieId]/route';
import { GET as getFavoriteProfile } from '@/app/api/favorite/route';
import { GET as getPlaylists } from '@/app/api/playlist/route';
import { GET as getPlaylist } from '@/app/api/playlist/[playlistId]/route';
import { GET as getContinueWatching } from '@/app/api/continue-watching/route';
import { GET as getAdminOverview } from '@/app/api/statistics/admin-overview/route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedDb = db as any;
const mockedHelpers = apiHelpers as jest.Mocked<typeof apiHelpers>;
const mockedRecentIds = getRecentContinueWatchingIds as jest.MockedFunction<typeof getRecentContinueWatchingIds>;

const json = (response: Response) => response.json();

describe('API route coverage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedHelpers.handleApiError.mockImplementation((error: unknown) =>
      Response.json({ error: String(error) }, { status: 500 }),
    );
    mockedHelpers.serializeMovie.mockImplementation((movie: any) => movie);
    mockedHelpers.transformMoviesResponse.mockImplementation((movies: any) => movies);
    mockedRecentIds.mockReturnValue(['movie1']);
  });

  it('returns the current user or a 404', async () => {
    mockedCurrentUser.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: 'user1' } as any);

    expect((await getCurrentUser()).status).toBe(404);
    expect(await json(await getCurrentUser())).toEqual({ id: 'user1' });
  });

  it('returns the active profile and handles missing data and failures', async () => {
    mockedCurrentUser.mockResolvedValueOnce(undefined).mockResolvedValue({ id: 'user1' } as any);
    expect((await getCurrentProfile()).status).toBe(404);

    mockedDb.profil.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'profile1' });
    expect((await getCurrentProfile()).status).toBe(404);
    expect(await json(await getCurrentProfile())).toEqual({ id: 'profile1' });

    mockedCurrentUser.mockRejectedValueOnce(new Error('auth failed'));
    expect((await getCurrentProfile()).status).toBe(400);
  });

  it('lists profiles and handles unauthorized and database failure cases', async () => {
    mockedCurrentUser.mockResolvedValueOnce(undefined).mockResolvedValue({ id: 'user1' } as any);
    expect((await getProfiles()).status).toBe(404);

    mockedDb.profil.findMany.mockResolvedValueOnce([{ id: 'profile1' }]);
    expect(await json(await getProfiles())).toEqual([{ id: 'profile1' }]);

    mockedDb.profil.findMany.mockRejectedValueOnce(new Error('db failed'));
    expect((await getProfiles()).status).toBe(400);
  });

  it('lists profile images and converts database errors to a null response', async () => {
    mockedDb.profilImg.findMany.mockResolvedValueOnce([{ id: 'image1' }]);
    expect(await json(await getProfileImages())).toEqual([{ id: 'image1' }]);

    mockedDb.profilImg.findMany.mockRejectedValueOnce(new Error('db failed'));
    expect(await json(await getProfileImages())).toBeNull();
  });

  it('returns a random movie and covers empty and error outcomes', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.movie.count.mockResolvedValueOnce(0).mockResolvedValue(1);
    expect(await json(await getRandom())).toBeNull();

    mockedDb.movie.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'movie1', createdAt: new Date('2024-01-01') }]);
    expect(await json(await getRandom())).toBeNull();
    expect(await json(await getRandom())).toMatchObject({ id: 'movie1' });

    mockedDb.movie.count.mockRejectedValueOnce(new Error('db failed'));
    expect(await json(await getRandom())).toBeNull();
  });

  it('covers random movie and series helper routes', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedHelpers.getRandomMovie
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'movie1' } as any)
      .mockResolvedValueOnce({ id: 'series1' } as any);

    expect(await json(await getRandomMovie())).toBeNull();
    expect(await json(await getRandomMovie())).toEqual({ id: 'movie1' });
    expect(await json(await getRandomSeries())).toEqual({ id: 'series1' });
  });

  it('covers movie and series collection routes', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' },
      profil: { id: 'profile1' },
      error: null,
    } as any);
    mockedHelpers.getMoviesWithWatchTime.mockResolvedValue({ movies: [{ id: 'media1' }], watchTime: [] } as any);
    mockedHelpers.transformMoviesResponse.mockReturnValue([{ id: 'media1' }] as any);

    expect(await json(await getMovies())).toEqual([{ id: 'media1' }]);
    expect(await json(await getSeries())).toEqual([{ id: 'media1' }]);
    expect(mockedHelpers.getMoviesWithWatchTime).toHaveBeenCalledWith('Movie', 'user1', 'profile1');
    expect(mockedHelpers.getMoviesWithWatchTime).toHaveBeenCalledWith('Serie', 'user1', 'profile1');
  });

  it('covers actor count and pagination routes', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedHelpers.getActorNamesForType.mockResolvedValue(['A', 'B'] as any);
    mockedHelpers.getActorsWithPagination.mockResolvedValue([{ name: 'A' }] as any);

    expect(await json(await getMovieActorCount())).toBe(2);
    expect(await json(await getSeriesActorCount())).toBe(2);
    expect(await json(await getMovieActors(undefined as any, { params: Promise.resolve({ limit: '2_5' }) }))).toEqual([{ name: 'A' }]);
    expect(await json(await getSeriesActors(undefined as any, { params: Promise.resolve({ limit: '1_3' }) }))).toEqual([{ name: 'A' }]);
  });

  it('covers movie and series lookups by actor', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedHelpers.getMoviesByActor.mockResolvedValue([{ id: 'media1' }] as any);

    expect(await json(await getMoviesByActor(undefined as any, { params: Promise.resolve({ actor: 'Actor' }) }))).toEqual([{ id: 'media1' }]);
    expect(await json(await getSeriesByActor(undefined as any, { params: Promise.resolve({ actor: 'Actor' }) }))).toEqual([{ id: 'media1' }]);
  });

  it('returns movie view counts and handles missing IDs and errors', async () => {
    expect((await getMovieViews(undefined as any, { params: Promise.resolve({ movieId: '' }) })).status).toBe(404);
    mockedDb.movieView.count.mockResolvedValueOnce(7).mockRejectedValueOnce(new Error('db failed'));
    expect(await json(await getMovieViews(undefined as any, { params: Promise.resolve({ movieId: 'movie1' }) }))).toEqual({ count: 7 });
    expect((await getMovieViews(undefined as any, { params: Promise.resolve({ movieId: 'movie1' }) })).status).toBe(500);
  });

  it('checks admin access', async () => {
    mockedCurrentRole.mockResolvedValueOnce(UserRole.ADMIN).mockResolvedValueOnce(UserRole.USER);
    expect((await getAdmin()).status).toBe(200);
    expect((await getAdmin()).status).toBe(403);
  });

  it('lists admin users and maps profiles', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    expect((await getAdminUsers()).status).toBe(403);

    mockedDb.user.count.mockResolvedValue(1);
    mockedDb.user.findMany.mockResolvedValueOnce([{ id: 'user1', profil: [{ id: 'profile1' }] }]);
    expect(await json(await getAdminUsers())).toMatchObject({
      users: [expect.objectContaining({ id: 'user1', profiles: [{ id: 'profile1' }] })],
      total: 1,
      totalPages: 1,
    });
  });

  it('validates and updates blocked users', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    const request = (body: unknown) => new Request('http://localhost/api/admin/users/block', {
      method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
    });
    expect((await blockAdminUser(request({ userId: 'user1', block: true }))).status).toBe(403);
    expect((await blockAdminUser(request({ userId: '', block: true }))).status).toBe(400);

    mockedDb.user.findUnique.mockResolvedValueOnce({ role: 'USER' });
    mockedDb.user.update.mockResolvedValueOnce({ id: 'user1', isBlocked: true });
    expect(await json(await blockAdminUser(request({ userId: 'user1', block: true })))).toMatchObject({ success: true });
  });

  it('returns watchlist movies for the active profile', async () => {
    mockedCurrentUser.mockResolvedValueOnce(undefined).mockResolvedValue({ id: 'user1' } as any);
    expect((await getWatchlist()).status).toBe(401);

    mockedDb.profil.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'profile1' });
    expect(await json(await getWatchlist())).toEqual([]);
    mockedDb.watchlist.findMany.mockResolvedValue([{ movie: { id: 'movie1' } }]);
    expect(await json(await getWatchlist())).toEqual([{ id: 'movie1' }]);
  });

  it('returns actor statistics to admins', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    expect((await getAllActors()).status).toBe(403);

    mockedDb.actor.findMany.mockResolvedValue([{ id: 'actor1', name: 'Actor', movies: [
      { movie: { id: 'movie1', type: 'Movie' } },
      { movie: { id: 'series1', type: 'Serie' } },
    ] }]);
    mockedDb.movieView.count.mockResolvedValueOnce(3).mockResolvedValueOnce(4);
    expect(await json(await getAllActors())).toEqual({ actors: [
      { id: 'actor1', name: 'Actor', movieCount: 1, seriesCount: 1, views: 7 },
    ] });
  });

  it('returns newly added movies and series with actors and watch time', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedHelpers.getMoviesWithWatchTime.mockResolvedValue({
      movies: [{
        id: 'movie1', title: 'Title', actors: [{ actor: { id: 'actor1', name: 'Actor' } }],
      }],
      watchTime: [{ movieId: 'movie1', time: 30 }],
    } as any);
    mockedHelpers.transformMoviesResponse.mockReturnValue([{
      id: 'movie1', title: 'Title', actors: ['Actor'], watchTime: 30,
    }] as any);

    expect(await json(await getNewMovies())).toEqual([
      expect.objectContaining({ id: 'movie1', actors: ['Actor'], watchTime: 30 }),
    ]);
    expect(await json(await getNewMedia())).toEqual([
      expect.objectContaining({ id: 'movie1', actors: ['Actor'], watchTime: 30 }),
    ]);
    expect(await json(await getNewSeries())).toEqual([
      expect.objectContaining({ id: 'movie1', actors: ['Actor'], watchTime: 30 }),
    ]);
  });

  it('returns the authentication or profile error from new-media routes', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      error: new Response(null, { status: 404 }),
    } as any);
    expect((await getNewMovies()).status).toBe(404);
    expect((await getNewMedia()).status).toBe(404);
    expect((await getNewSeries()).status).toBe(404);
  });

  it('returns complete movie and series collections to admins', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.movie.findMany.mockResolvedValue([{ id: 'movie1' }]);
    mockedDb.movieView.groupBy.mockResolvedValue([{ movieId: 'movie1', _count: { movieId: 9 } }]);

    expect(await json(await getAllMovies())).toEqual({
      movies: [{ id: 'movie1', views: 9 }], total: 1,
    });
    expect(await json(await getAllSeries())).toEqual([{ id: 'movie1', views: 9 }]);
  });

  it('paginates the admin movie collection', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.movie.count.mockResolvedValue(21);
    mockedDb.movie.findMany.mockResolvedValue([{ id: 'movie1' }]);
    mockedDb.movieView.groupBy.mockResolvedValue([{ movieId: 'movie1', _count: { movieId: 2 } }]);

    const response = await getAdminMovies(new Request('http://localhost/api/movies/admin?page=2&pageSize=10'));
    expect(await json(response)).toMatchObject({ page: 2, pageSize: 10, totalPages: 3 });
  });

  it('returns randomized movie and series collections', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedDb.movie.findMany
      .mockResolvedValueOnce([{ id: 'movie1' }, { id: 'movie2' }])
      .mockResolvedValueOnce([{ id: 'movie1', createdAt: new Date('2024-01-01') }])
      .mockResolvedValueOnce([{ id: 'series1' }, { id: 'series2' }])
      .mockResolvedValueOnce([{ id: 'series1', createdAt: new Date('2024-01-01') }]);
    const request = { nextUrl: { searchParams: new URLSearchParams('count=1') } } as any;

    expect(await json(await getRandomMovies(request))).toEqual([
      expect.objectContaining({ id: 'movie1', createdAt: '2024-01-01T00:00:00.000Z' }),
    ]);
    expect(await json(await getRandomSeriesCollection(request))).toEqual([
      expect.objectContaining({ id: 'series1', createdAt: '2024-01-01T00:00:00.000Z' }),
    ]);
  });

  it('returns favorites and the favorite profile', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1', favoriteIds: ['movie1'] });
    mockedDb.movie.findMany.mockResolvedValue([{
      id: 'movie1', title: 'Title', actors: [{ actor: { name: 'Actor' } }],
    }]);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([{ movieId: 'movie1', time: 30 }]);

    expect(await json(await getFavorites())).toEqual([
      expect.objectContaining({ id: 'movie1', actors: ['Actor'], watchTime: 30 }),
    ]);
    expect(await json(await getFavoriteMovie(undefined as any, {
      params: Promise.resolve({ movieId: 'movie1' }),
    }))).toEqual([expect.objectContaining({ id: 'movie1', actor: 'Actor', watchTime: 30 })]);
    expect(await json(await getFavoriteProfile())).toMatchObject({ id: 'profile1' });
  });

  it('returns playlists with ordered movie entries', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.playlist.findMany.mockResolvedValue([{ id: 'playlist1', title: 'Favorites' }]);
    mockedDb.playlist.findUnique.mockResolvedValue({ id: 'playlist1', title: 'Favorites' });
    mockedDb.playlistEntry.findMany.mockResolvedValue([{ movieId: 'movie1' }]);
    mockedDb.movie.findUnique.mockResolvedValue({ id: 'movie1' });

    expect(await json(await getPlaylists())).toEqual([
      expect.objectContaining({ id: 'playlist1', movies: [{ id: 'movie1' }] }),
    ]);

    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedDb.playlist.findFirst.mockResolvedValue({ id: 'playlist1' });
    mockedDb.movie.findMany.mockResolvedValue([{ id: 'movie1' }]);
    expect(await json(await getPlaylist(undefined as any, {
      params: Promise.resolve({ playlistId: 'playlist1' }),
    }))).toEqual(expect.objectContaining({ id: 'playlist1', movies: [{ id: 'movie1' }] }));
  });

  it('builds the continue-watching response', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([{ movieId: 'movie1', time: 30 }]);
    mockedDb.movie.findMany.mockResolvedValue([{
      id: 'movie1', duration: '01:00:00', actors: [{ actor: { id: 'actor1', name: 'Actor' } }],
    }]);
    mockedDb.movieView.findMany.mockResolvedValue([{ movieId: 'movie1', createdAt: new Date() }]);

    expect(await json(await getContinueWatching())).toEqual([
      expect.objectContaining({ id: 'movie1', actor: 'Actor', watchTime: 30 }),
    ]);
  });

  it('returns period-based admin statistics', async () => {
    mockedIsAdmin.mockResolvedValue(true);
    mockedDb.movie.findMany.mockResolvedValue([
      { id: 'movie1', title: 'Movie', type: 'Movie', genre: 'Drama', duration: '01:30:00', createdAt: new Date() },
      { id: 'series1', title: 'Series', type: 'Serie', genre: 'Drama', duration: '00:45:00', createdAt: new Date() },
    ]);
    mockedDb.movieView.findMany.mockResolvedValue([{ movieId: 'movie1', userId: 'user1', createdAt: new Date() }]);
    mockedDb.movieView.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    mockedDb.user.count.mockResolvedValue(1);
    mockedDb.profil.count.mockResolvedValue(1);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([{ movieId: 'movie1', time: 2700 }]);

    expect(await json(await getAdminOverview())).toMatchObject({
      totalViews: 1,
      periodViews: 1,
      activeUsers: 1,
      averageProgress: 50,
    });
  });
});
