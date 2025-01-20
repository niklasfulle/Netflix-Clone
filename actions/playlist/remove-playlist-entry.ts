"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { PlaylistSelectSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const removePlaylistEntry = async (values: z.infer<typeof PlaylistSelectSchema>) => {
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


  await db.playlistEntry.deleteMany({
    where: {
      playlistId: playlistId,
      movieId: movieId
    }
  })

  return { success: "Removed from Playlist" }
}