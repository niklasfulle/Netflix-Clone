"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { PlaylistRemoveSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const removePlaylist = async (playlistId: string) => {
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

  await db.playlist.delete({
    where: {
      id: playlistId
    }
  })

  return { success: "Playlist removed!" }
}