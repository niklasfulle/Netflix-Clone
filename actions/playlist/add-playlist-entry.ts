"use server"
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistSelectSchema } from '@/schemas';

export const addPlaylistEntry = async (values: z.infer<typeof PlaylistSelectSchema>) => {
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

  const validatedField = PlaylistSelectSchema.safeParse(values);

  if (!validatedField.success) {
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
    return { error: "Already in Playlist" }
  }

  await db.playlistEntry.create({
    data: {
      playlistId: playlistId,
      movieId: movieId,
      order: PlaylistEntires.length + 1
    }
  })

  return { success: "Added to Playlist" }
}