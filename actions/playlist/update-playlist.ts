"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { PlaylistSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const updatePlaylist = async (values: z.infer<typeof PlaylistSchema>) => {
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

  const { playlistId, playlistName } = validatedField.data

  await db.playlist.update({
    where: {
      id: playlistId
    },
    data: {
      title: playlistName
    }
  })

  return { success: "Playlist created!" }
}