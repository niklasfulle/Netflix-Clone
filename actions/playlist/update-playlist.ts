"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSchema } from '@/schemas';
import { findOwnedPlaylist } from '@/lib/ownership';

type PlaylistMovie = { id: string };

export const updatePlaylist = async (
  values: z.infer<typeof PlaylistSchema>,
  moviesToRemove: string[],
  moviesToUpdate: PlaylistMovie[],
) => {
  const user = await currentUser()

  if (!user?.id) {
    logBackendAction('updatePlaylist_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('updatePlaylist_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }

  const validatedField = PlaylistSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('updatePlaylist_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  const { playlistId, playlistName } = validatedField.data

  if (!playlistId) {
    return { error: "Invalid fields!" }
  }

  const ownedPlaylist = await findOwnedPlaylist({
    playlistId,
    userId: user.id,
    profileId: profil.id,
  });

  if (!ownedPlaylist) {
    logBackendAction('updatePlaylist_not_found', { userId: user.id, playlistId }, 'warn');
    return { error: "Playlist not found!" }
  }

  await db.$transaction(async (transaction) => {
    await transaction.playlist.update({
      where: { id: ownedPlaylist.id },
      data: { title: playlistName },
    });

    await Promise.all(moviesToUpdate.map((movie, index) =>
      transaction.playlistEntry.updateMany({
        where: { playlistId: ownedPlaylist.id, movieId: movie.id },
        data: { order: index + 1 },
      }),
    ));

    await Promise.all(moviesToRemove.map((movieId) =>
      transaction.playlistEntry.deleteMany({
        where: { playlistId: ownedPlaylist.id, movieId },
      }),
    ));
  });

  logBackendAction('updatePlaylist_success', { userId: user.id, playlistId }, 'info');

  return { success: "Playlist updated!" }
}
