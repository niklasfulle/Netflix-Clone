import type { Profil } from '@prisma/client';
import { db } from '@/lib/db';
import { catalogThumbnailUrl } from '@/lib/catalog';
import { FAVORITES_PLAYLIST_ID } from '@/lib/playlists';
import type { PlaylistDto } from '@/lib/api-types';

export async function getFavoritesPlaylist(
  userId: string,
  profile: Pick<Profil, 'id' | 'favoriteIds'>,
): Promise<PlaylistDto> {
  const favoriteIds = [...new Set(profile.favoriteIds ?? [])];
  const movies = favoriteIds.length === 0 ? [] : await db.movie.findMany({
    where: { id: { in: favoriteIds } },
    select: { id: true, title: true, type: true, genre: true, duration: true },
  });
  const byId = new Map(movies.map((movie) => [movie.id, movie]));

  return {
    id: FAVORITES_PLAYLIST_ID,
    kind: 'favorites',
    title: 'Favorites',
    userId,
    profilId: profile.id,
    movies: favoriteIds.flatMap((id) => {
      const movie = byId.get(id);
      return movie ? [{ ...movie, thumbnailUrl: catalogThumbnailUrl(movie.id) }] : [];
    }),
  };
}
