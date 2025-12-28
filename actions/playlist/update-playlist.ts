"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSchema } from '@/schemas';

export const updatePlaylist = async (values: z.infer<typeof PlaylistSchema>, moviesToRemove: any, moviesToUpdate: any) => {
  const user = await currentUser()

  if (!user) {
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
  logBackendAction('updatePlaylist_success', { userId: user.id, playlistId: validatedField.data.playlistId }, 'info');

  const { playlistId, playlistName } = validatedField.data


  await db.playlist.update({
    where: {
      id: playlistId
    },
    data: {
      title: playlistName
    }
  })

  moviesToUpdate.forEach(async function (movie: any, index: number) {
    await db.playlistEntry.updateMany({
      where: {
        playlistId: playlistId,
        movieId: movie.id
      },
      data: {
        order: index + 1
      }
    })
  });

  moviesToRemove.forEach(async function (movieId: any) {
    await db.playlistEntry.deleteMany({
      where: {
        playlistId: playlistId,
        movieId: movieId
      },
    })
  });

  return { success: "Playlist updated!" }
}