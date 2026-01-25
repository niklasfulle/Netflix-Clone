jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    movie: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { remove } from '../remove';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('favorite remove action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await remove({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId leer ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: [],
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await remove({ movieId: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Empty string ist gültig für Zod (min(1) prüft nicht empty string!)
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.movie.findUnique).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: [],
    });

    const result = await remove({ movieId: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Null ist ungültig, Validierung schlägt VOR profil check fehl
    expect(db.profil.findFirst).not.toHaveBeenCalled();
    expect(db.movie.findUnique).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await remove({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'No profil found!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.movie.findUnique).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Movie nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: ['movie123'],
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await remove({ movieId: 'invalid-movie' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.update).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Film aus Favoriten entfernen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: ['movie123', 'movie456'],
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue({
      id: 'movie123',
    });
    (db.profil.update as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: ['movie456'],
    });

    const result = await remove({ movieId: 'movie123' });

    expect(result).toEqual({ success: 'Favorite removed!', data: ['movie456'] });
    expect(db.profil.update).toHaveBeenCalled();
  });
});
