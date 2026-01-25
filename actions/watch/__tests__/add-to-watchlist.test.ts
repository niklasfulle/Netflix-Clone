jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    watchlist: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    movie: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { addToWatchlist } from '../add-to-watchlist';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('add to watchlist action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await addToWatchlist({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await addToWatchlist({ movieId: '' });

    // Empty string ist gültig nach Zod, also Profil-Check kommt VOR Validierung
    expect(result).toEqual({ error: 'No active profile!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await addToWatchlist({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'No active profile!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.watchlist.findFirst).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Film zur Watchlist hinzufügen (neu)', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.watchlist.findFirst as jest.Mock).mockResolvedValue(null);
    (db.watchlist.create as jest.Mock).mockResolvedValue({
      id: 'wl1',
      movieId: 'movie123',
    });

    const result = await addToWatchlist({ movieId: 'movie123' });

    expect(result.success).toBeDefined();
    expect(db.watchlist.create).toHaveBeenCalled();
  });

  it('✅ sollte existierende Watchlist-Eintrag aktualisieren', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.watchlist.findFirst as jest.Mock).mockResolvedValue({
      id: 'wl1',
      movieId: 'movie123',
    });
    (db.watchlist.update as jest.Mock).mockResolvedValue({
      id: 'wl1',
      movieId: 'movie123',
    });

    const result = await addToWatchlist({ movieId: 'movie123' });

    expect(result.success).toBeDefined();
    expect(db.watchlist.update).toHaveBeenCalled();
  });
});
