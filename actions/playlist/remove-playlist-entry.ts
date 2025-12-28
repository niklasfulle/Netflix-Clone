"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSelectSchema } from '@/schemas';

export const removePlaylistEntry = async (values: z.infer<typeof PlaylistSelectSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('removePlaylistEntry_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('removePlaylistEntry_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }

  const validatedField = PlaylistSelectSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('removePlaylistEntry_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { playlistId, movieId } = validatedField.data

  await db.playlistEntry.deleteMany({
    where: {
      playlistId: playlistId,
      movieId: movieId
    }
  })

  logBackendAction('removePlaylistEntry_success', { userId: user.id, playlistId, movieId }, 'info');

  return { success: "Removed from Playlist" }
}