"use server"
import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlaylistRemoveSchema } from '@/schemas';
import { findOwnedPlaylist } from '@/lib/ownership';

export const removePlaylist = async (playlistId: string) => {
  const user = await currentUser()

  if (!user?.id) {
    logBackendAction('removePlaylist_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = PlaylistRemoveSchema.safeParse({ playlistId });

  if (!validatedField.success) {
    logBackendAction('removePlaylist_invalid_fields', { userId: user.id }, 'error');
    return { error: "Invalid fields!" }
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
  const ownedPlaylist = await findOwnedPlaylist({
    playlistId: validatedField.data.playlistId,
    userId: user.id,
    profileId: profil.id,
  })

  if (!ownedPlaylist) {
    logBackendAction('removePlaylist_not_found', { userId: user.id, playlistId }, 'warn');
    return { error: "Playlist not found!" }
  }

  await db.playlist.delete({
    where: {
      id: ownedPlaylist.id
    }
  })

  logBackendAction('removePlaylist_success', { userId: user.id, playlistId }, 'info');

  return { success: "Playlist removed!" }
}
