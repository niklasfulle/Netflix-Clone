"use server"
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

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