jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    playlist: {
      update: jest.fn(),
    },
    playlistEntry: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { updatePlaylist } from '../update-playlist';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('update playlist action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(
      updatePlaylist({ playlistId: 'playlist1', playlistName: 'Favorites' }, [], []),
    ).resolves.toEqual({ error: 'Unauthorized!' });

    expect(db.profil.findFirst).not.toHaveBeenCalled();
    expect(logBackendAction).toHaveBeenCalledWith(
      'updatePlaylist_unauthorized',
      {},
      'error',
    );
  });

  it('rejects users without an active profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      updatePlaylist({ playlistId: 'playlist1', playlistName: 'Favorites' }, [], []),
    ).resolves.toEqual({ error: 'No profil found!' });

    expect(db.playlist.update).not.toHaveBeenCalled();
  });

  it('rejects invalid playlist data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });

    await expect(
      updatePlaylist({ playlistId: 'playlist1', playlistName: '' }, [], []),
    ).resolves.toEqual({ error: 'Invalid fields!' });

    expect(db.playlist.update).not.toHaveBeenCalled();
  });

  it('renames the playlist, reorders entries, and removes selected movies', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.update as jest.Mock).mockResolvedValue({ id: 'playlist1' });
    (db.playlistEntry.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (db.playlistEntry.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await updatePlaylist(
      { playlistId: 'playlist1', playlistName: 'Favorites' },
      ['old-movie'],
      [{ id: 'movie1' }, { id: 'movie2' }],
    );
    await Promise.resolve();

    expect(result).toEqual({ success: 'Playlist updated!' });
    expect(db.playlist.update).toHaveBeenCalledWith({
      where: { id: 'playlist1' },
      data: { title: 'Favorites' },
    });
    expect(db.playlistEntry.updateMany).toHaveBeenNthCalledWith(1, {
      where: { playlistId: 'playlist1', movieId: 'movie1' },
      data: { order: 1 },
    });
    expect(db.playlistEntry.updateMany).toHaveBeenNthCalledWith(2, {
      where: { playlistId: 'playlist1', movieId: 'movie2' },
      data: { order: 2 },
    });
    expect(db.playlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { playlistId: 'playlist1', movieId: 'old-movie' },
    });
  });
});
