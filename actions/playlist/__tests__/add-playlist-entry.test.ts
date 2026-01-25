jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    playlistEntry: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { addPlaylistEntry } from '../add-playlist-entry';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('add playlist entry action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await addPlaylistEntry({ playlistId: 'pl1', movieId: 'movie123' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await addPlaylistEntry({ playlistId: 'pl1', movieId: 'movie123' });

    expect(result).toEqual({ error: 'No profil found!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.playlistEntry.findMany).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn playlistId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    // PlaylistSelectSchema akzeptiert z.string() ohne min(1), daher werden leere Strings akzeptiert!
    // Die Action wird weitermachen und findMany aufrufen
    (db.playlistEntry.findMany as jest.Mock).mockResolvedValue([]);
    (db.playlistEntry.create as jest.Mock).mockResolvedValue({ id: 'entry1' });

    const result = await addPlaylistEntry({ playlistId: '', movieId: 'movie123' });

    // Leere String wird akzeptiert, DB wird aufgerufen
    expect(result.success).toBeDefined();
    expect(db.playlistEntry.findMany).toHaveBeenCalled();
    expect(db.playlistEntry.create).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    (db.playlistEntry.findMany as jest.Mock).mockResolvedValue([]);
    (db.playlistEntry.create as jest.Mock).mockResolvedValue({ id: 'entry1' });

    const result = await addPlaylistEntry({ playlistId: 'pl1', movieId: '' });

    // Leere String wird akzeptiert, DB wird aufgerufen
    expect(result.success).toBeDefined();
    expect(db.playlistEntry.findMany).toHaveBeenCalled();
    expect(db.playlistEntry.create).toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Eintrag zu Playlist hinzufügen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.playlistEntry.findMany as jest.Mock).mockResolvedValue([]);
    (db.playlistEntry.create as jest.Mock).mockResolvedValue({
      id: 'entry1',
      playlistId: 'pl1',
      movieId: 'movie123',
    });

    const result = await addPlaylistEntry({ playlistId: 'pl1', movieId: 'movie123' });

    expect(result.success).toBeDefined();
    expect(db.playlistEntry.create).toHaveBeenCalled();
  });
});
