"use server"
import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const removePlaylist = async (playlistId: string) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('removePlaylist_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('removePlaylist_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }
  logBackendAction('removePlaylist_success', { userId: user.id, playlistId }, 'info');

  await db.playlist.delete({
    where: {
      id: playlistId
    }
  })

  return { success: "Playlist removed!" }
}