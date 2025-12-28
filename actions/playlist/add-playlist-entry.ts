"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSelectSchema } from '@/schemas';

export const addPlaylistEntry = async (values: z.infer<typeof PlaylistSelectSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('addPlaylistEntry_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('addPlaylistEntry_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }

  const validatedField = PlaylistSelectSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('addPlaylistEntry_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { playlistId, movieId } = validatedField.data

  const PlaylistEntires = await db.playlistEntry.findMany({
    where: {
      playlistId: playlistId
    }
  })

  const isInPlaylist = PlaylistEntires.find(playlistEntry => playlistEntry.movieId === movieId);

  if (isInPlaylist) {
    logBackendAction('addPlaylistEntry_already_in_playlist', { userId: user.id, playlistId, movieId }, 'error');
    return { error: "Already in Playlist" }
  }
  logBackendAction('addPlaylistEntry_success', { userId: user.id, playlistId, movieId }, 'info');

  await db.playlistEntry.create({
    data: {
      playlistId: playlistId,
      movieId: movieId,
      order: PlaylistEntires.length + 1
    }
  })

  return { success: "Added to Playlist" }
}