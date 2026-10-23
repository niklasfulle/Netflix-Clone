import { db } from '@/lib/db';
import { getFavoritesPlaylist } from '../favorites-playlist';

jest.mock('@/lib/db', () => ({ db: { movie: { findMany: jest.fn() } } }));

beforeEach(() => jest.clearAllMocks());

it.each([{ favoriteIds: [] }, { favoriteIds: undefined }])('returns an empty automatic playlist without querying the catalog: %j', async ({ favoriteIds }) => {
  await expect(getFavoritesPlaylist('user', { id: 'profile', favoriteIds } as Parameters<typeof getFavoritesPlaylist>[1])).resolves.toMatchObject({ id: 'favorites', kind: 'favorites', userId: 'user', profilId: 'profile', movies: [] });
  expect(db.movie.findMany).not.toHaveBeenCalled();
});

it('preserves favorite order while removing duplicate ids and unavailable catalog items', async () => {
  jest.mocked(db.movie.findMany).mockResolvedValue([{ id: 'two', title: 'Second' }, { id: 'one', title: 'First' }] as never);
  const playlist = await getFavoritesPlaylist('user', { id: 'profile', favoriteIds: ['one', 'removed', 'two', 'one'] });
  expect(playlist.movies).toEqual([
    { id: 'one', title: 'First', thumbnailUrl: '/api/catalog/thumbnails/one' },
    { id: 'two', title: 'Second', thumbnailUrl: '/api/catalog/thumbnails/two' },
  ]);
});
