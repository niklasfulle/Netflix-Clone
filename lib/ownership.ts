import { db } from '@/lib/db';
import { FAVORITES_PLAYLIST_ID } from '@/lib/playlists';

type OwnedPlaylistInput = {
  playlistId: string;
  userId: string;
  profileId: string;
};

export function findOwnedPlaylist({ playlistId, userId, profileId }: OwnedPlaylistInput) {
  if (playlistId === FAVORITES_PLAYLIST_ID) return null;
  return db.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
      profilId: profileId,
    },
    select: { id: true },
  });
}

export function findOwnedProfile(profileId: string, userId: string) {
  return db.profil.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
}
