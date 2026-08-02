jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    $transaction: jest.fn(async (callback) => callback({
      playlist: { update: jest.fn() },
      playlistEntry: { updateMany: jest.fn(), deleteMany: jest.fn() },
    })),
    profil: {
      findFirst: jest.fn(),
    },
    playlist: {
      findFirst: jest.fn(),
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
    (db.playlist.findFirst as jest.Mock).mockResolvedValue({ id: 'playlist1' });

    const transaction = {
      playlist: { update: jest.fn().mockResolvedValue(undefined) },
      playlistEntry: {
        updateMany: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    (db.$transaction as jest.Mock).mockImplementationOnce(async (callback) => callback(transaction));

    const result = await updatePlaylist(
      { playlistId: 'playlist1', playlistName: 'Favorites' },
      ['old-movie'],
      [{ id: 'movie1' }, { id: 'movie2' }],
    );
    expect(result).toEqual({ success: 'Playlist updated!' });
    expect(db.playlist.findFirst).toHaveBeenCalledWith({
      where: { id: 'playlist1', userId: 'user1', profilId: 'profile1' },
      select: { id: true },
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.playlist.update).toHaveBeenCalledWith({
      where: { id: 'playlist1' },
      data: { title: 'Favorites' },
    });
    expect(transaction.playlistEntry.updateMany).toHaveBeenNthCalledWith(1, {
      where: { playlistId: 'playlist1', movieId: 'movie1' },
      data: { order: 1 },
    });
    expect(transaction.playlistEntry.updateMany).toHaveBeenNthCalledWith(2, {
      where: { playlistId: 'playlist1', movieId: 'movie2' },
      data: { order: 2 },
    });
    expect(transaction.playlistEntry.deleteMany).toHaveBeenCalledWith({
      where: { playlistId: 'playlist1', movieId: 'old-movie' },
    });
    expect(db.playlistEntry.updateMany).not.toHaveBeenCalled();
    expect(db.playlistEntry.deleteMany).not.toHaveBeenCalled();
  });

  it('waits for every transactional entry mutation before reporting success', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.findFirst as jest.Mock).mockResolvedValue({ id: 'playlist1' });
    let releaseUpdate: (() => void) | undefined;
    const pendingUpdate = new Promise<void>((resolve) => { releaseUpdate = resolve; });
    const transaction = {
      playlist: { update: jest.fn().mockResolvedValue(undefined) },
      playlistEntry: {
        updateMany: jest.fn().mockReturnValue(pendingUpdate),
        deleteMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    (db.$transaction as jest.Mock).mockImplementationOnce(async (callback) => callback(transaction));

    let settled = false;
    const update = updatePlaylist(
      { playlistId: 'playlist1', playlistName: 'Favorites' },
      [],
      [{ id: 'movie1' }],
    ).finally(() => { settled = true; });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(logBackendAction).not.toHaveBeenCalledWith(
      'updatePlaylist_success',
      expect.anything(),
      'info',
    );
    releaseUpdate?.();
    await expect(update).resolves.toEqual({ success: 'Playlist updated!' });
  });

  it('does not report success when the transaction rolls back', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.findFirst as jest.Mock).mockResolvedValue({ id: 'playlist1' });
    const transaction = {
      playlist: { update: jest.fn().mockResolvedValue(undefined) },
      playlistEntry: {
        updateMany: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockRejectedValue(new Error('transaction rolled back')),
      },
    };
    (db.$transaction as jest.Mock).mockImplementationOnce(async (callback) => callback(transaction));

    await expect(updatePlaylist(
      { playlistId: 'playlist1', playlistName: 'Favorites' },
      ['movie1'],
      [],
    )).rejects.toThrow('transaction rolled back');
    expect(logBackendAction).not.toHaveBeenCalledWith(
      'updatePlaylist_success',
      expect.anything(),
      'info',
    );
  });

  it('does not update a playlist owned by another profile', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({ id: 'profile1' });
    (db.playlist.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      updatePlaylist({ playlistId: 'foreign', playlistName: 'Favorites' }, [], []),
    ).resolves.toEqual({ error: 'Playlist not found!' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
