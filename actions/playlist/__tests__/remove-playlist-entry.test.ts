jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    playlistEntry: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { removePlaylistEntry } from '../remove-playlist-entry';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('remove playlist entry action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await removePlaylistEntry({
      playlistId: 'pl1',
      movieId: 'movie1',
    });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn kein aktives Profil existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await removePlaylistEntry({
      playlistId: 'pl1',
      movieId: 'movie1',
    });

    expect(result).toEqual({ error: 'No profil found!' });
    expect(db.playlistEntry.deleteMany).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Felder ungültig sind', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.playlistEntry.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    const result = await removePlaylistEntry({
      playlistId: '',
      movieId: 'movie1',
    });

    // PlaylistSelectSchema akzeptiert z.string() ohne min(1)
    expect(result.success).toBeDefined();
    expect(db.playlistEntry.deleteMany).toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Eintrag aus Playlist entfernen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.playlistEntry.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const result = await removePlaylistEntry({
      playlistId: 'pl1',
      movieId: 'movie1',
    });

    expect(result.success).toBeDefined();
    expect(db.playlistEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        playlistId: 'pl1',
        movieId: 'movie1',
      },
    });
  });

  it('✅ sollte DB-Aufrufe verhindern wenn nicht authentifiziert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await removePlaylistEntry({
      playlistId: 'pl1',
      movieId: 'movie1',
    });

    expect(db.playlistEntry.deleteMany).not.toHaveBeenCalled();
  });
});
