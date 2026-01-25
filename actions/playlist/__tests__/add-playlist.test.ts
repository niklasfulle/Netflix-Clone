jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    playlist: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { addPlaylist } from '../add-playlist';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('add playlist action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await addPlaylist({ playlistName: 'My Playlist' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn playlistName leer ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    const result = await addPlaylist({ playlistName: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Profil wird aufgerufen, aber da name leer ist, gibt es Fehler
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.playlist.create).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn playlistName null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    const result = await addPlaylist({ playlistName: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.playlist.create).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await addPlaylist({ playlistName: 'My Playlist' });

    expect(result).toEqual({ error: 'No profil found!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.playlist.create).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich neue Playlist erstellen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.playlist.create as jest.Mock).mockResolvedValue({
      id: 'playlist1',
      title: 'My Playlist',
    });

    const result = await addPlaylist({ playlistName: 'My Playlist' });

    expect(result.success).toEqual('Playlist created!');
    expect(db.playlist.create).toHaveBeenCalled();
  });

  it('✅ sollte lange Namen akzeptieren', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const longName = 'A'.repeat(500);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.playlist.create as jest.Mock).mockResolvedValue({
      id: 'playlist1',
      title: longName,
    });

    const result = await addPlaylist({ playlistName: longName });

    expect(result.success).toEqual('Playlist created!');
    expect(db.playlist.create).toHaveBeenCalled();
  });
});
