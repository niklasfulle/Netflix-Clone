"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSchema } from '@/schemas';

export const addPlaylist = async (values: z.infer<typeof PlaylistSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('addPlaylist_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('addPlaylist_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }

  const validatedField = PlaylistSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('addPlaylist_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { playlistName } = validatedField.data

  const playlist = await db.playlist.create({
    data: {
      userId: user.id as string,
      profilId: profil.id,
      title: playlistName
    }
  });

  logBackendAction('addPlaylist_success', { userId: user.id, playlistId: playlist.id }, 'info');

  return { success: "Playlist created!", playlist };
}