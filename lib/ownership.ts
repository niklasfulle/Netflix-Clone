import { db } from '@/lib/db';

type OwnedPlaylistInput = {
  playlistId: string;
  userId: string;
  profileId: string;
};

export function findOwnedPlaylist({ playlistId, userId, profileId }: OwnedPlaylistInput) {
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
