"use server"
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSchema } from '@/schemas';

export const addPlaylist = async (values: z.infer<typeof PlaylistSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    return { error: "No profil found!" }
  }

  const validatedField = PlaylistSchema.safeParse(values);

  if (!validatedField.success) {
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

  return { success: "Playlist created!", playlist };
}