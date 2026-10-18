import { NextRequest } from 'next/server';

import { ApiError, getUserAndProfile, handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { findOwnedPlaylist } from '@/lib/ownership';
import { getFavoritesPlaylist } from '@/data/favorites-playlist';
import { FAVORITES_PLAYLIST_ID } from '@/lib/playlists';

export const dynamic = 'force-dynamic';

type Params = {
  playlistId: string;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Params> },
): Promise<Response> {
  try {
    const { playlistId } = await context.params;
    if (!playlistId) throw new ApiError('VALIDATION_ERROR', 'Playlist ID is required.');

    const auth = await getUserAndProfile('api_playlist_detail');
    if (auth.error) return auth.error;

    if (playlistId === FAVORITES_PLAYLIST_ID) {
      return Response.json(await getFavoritesPlaylist(auth.user.id, auth.profil));
    }

    const ownedPlaylist = await findOwnedPlaylist({
      playlistId,
      userId: auth.user.id,
      profileId: auth.profil.id,
    });
    if (!ownedPlaylist) throw new ApiError('NOT_FOUND', 'Playlist not found.');

    const [playlist, entries] = await Promise.all([
      db.playlist.findUnique({ where: { id: ownedPlaylist.id } }),
      db.playlistEntry.findMany({
        where: { playlistId: ownedPlaylist.id },
        orderBy: { order: 'asc' },
      }),
    ]);
    if (!playlist) throw new ApiError('NOT_FOUND', 'Playlist not found.');

    const movieIds = entries.map((entry) => entry.movieId);
    const movies = movieIds.length === 0
      ? []
      : await db.movie.findMany({ where: { id: { in: movieIds } } });
    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));

    return Response.json({
      ...playlist,
      movies: movieIds.map((movieId) => moviesById.get(movieId) ?? null),
    });
  } catch (error) {
    return handleApiError(error, 'api_playlist_detail');
  }
}
