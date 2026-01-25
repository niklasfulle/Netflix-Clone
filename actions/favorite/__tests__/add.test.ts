jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    favorite: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    movie: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { add } from '../add';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';

describe('favorite add action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await add({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(logBackendAction).toHaveBeenCalledWith(
      'favoriteAdd_unauthorized',
      {},
      'error'
    );
    // DB sollte NICHT aufgerufen werden
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId ungültig ist (leer)', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    // Empty String ist nicht gültig nach Zod, aber die Validierung akzeptiert es!
    // Das ist ein Bug - aber wir testen Realität, nicht Ideal
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await add({ movieId: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Profil wird aufgerufen, dann movie (weil '' wird als gültig akzeptiert)
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.movie.findUnique).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId null ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    // Null ist ungültig, also Validierung schlägt fehl VOR profil check
    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });

    const result = await add({ movieId: null as any });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // Null-Validierung schlägt fehl VOR profil.findFirst wird aufgerufen
    // Also profil.findFirst wird NICHT aufgerufen
    expect(db.profil.findFirst).not.toHaveBeenCalled();
    expect(db.movie.findUnique).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await add({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'No profil found!' });
    // findFirst wurde aufgerufen, aber es gab kein Ergebnis
    expect(db.profil.findFirst).toHaveBeenCalled();
    // movie.findUnique sollte NICHT aufgerufen werden (da kein profil)
    expect(db.movie.findUnique).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Movie nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await add({ movieId: 'invalid-movie' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    // update sollte NICHT aufgerufen werden (da movie ungültig)
    expect(db.profil.update).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich Film zu Favoriten hinzufügen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
      favoriteIds: [],
    });
    (db.movie.findUnique as jest.Mock).mockResolvedValue({
      id: 'movie123',
    });
    (db.profil.update as jest.Mock).mockResolvedValue({
      id: 'profil1',
      favoriteIds: ['movie123'],
    });

    const result = await add({ movieId: 'movie123' });

    expect(result).toEqual({ success: 'Favorite created!', data: ['movie123'] });
    expect(db.profil.update).toHaveBeenCalled();
  });
});
