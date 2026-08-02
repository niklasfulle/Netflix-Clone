jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));

jest.mock('@/lib/db', () => ({
  db: {
    profil: { findFirst: jest.fn() },
    playlist: { findFirst: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));

import { removePlaylist } from '../remove-playlist';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('remove playlist action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(removePlaylist('playlist1')).resolves.toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
    expect(logBackendAction).toHaveBeenCalledWith(
      'removePlaylist_unauthorized',
      {},
      'error',
    );
  });

  it('rejects users without an active profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(removePlaylist('playlist1')).resolves.toEqual({ error: 'No profil found!' });
    expect(db.playlist.delete).not.toHaveBeenCalled();
  });

  it('deletes the selected playlist', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.findFirst as jest.Mock).mockResolvedValue({ id: 'playlist1' });
    (db.playlist.delete as jest.Mock).mockResolvedValue({ id: 'playlist1' });

    await expect(removePlaylist('playlist1')).resolves.toEqual({ success: 'Playlist removed!' });
    expect(db.playlist.delete).toHaveBeenCalledWith({ where: { id: 'playlist1' } });
    expect(logBackendAction).toHaveBeenCalledWith(
      'removePlaylist_success',
      { userId: 'user1', playlistId: 'playlist1' },
      'info',
    );
  });

  it('does not delete a playlist owned by another profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(removePlaylist('foreign-playlist')).resolves.toEqual({
      error: 'Playlist not found!',
    });
    expect(db.playlist.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-playlist', userId: 'user1', profilId: 'profile1' },
      select: { id: true },
    });
    expect(db.playlist.delete).not.toHaveBeenCalled();
  });
});
