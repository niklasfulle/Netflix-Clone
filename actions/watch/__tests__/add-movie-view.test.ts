jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    profil: {
      findFirst: jest.fn(),
    },
    movieView: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { addMovieView } from '../add-movie-view';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('add movie view action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await addMovieView({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.profil.findFirst).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn movieId ungültig ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const result = await addMovieView({ movieId: '' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn Profil nicht existiert', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    (db.profil.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await addMovieView({ movieId: 'movie123' });

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.profil.findFirst).toHaveBeenCalled();
    expect(db.movieView.findFirst).not.toHaveBeenCalled();
  });

  it('✅ sollte erfolgreich neuen Movie View erstellen', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.movieView.findFirst as jest.Mock).mockResolvedValue(null);
    (db.movieView.create as jest.Mock).mockResolvedValue({
      id: 'view1',
      movieId: 'movie123',
    });

    const result = await addMovieView({ movieId: 'movie123' });

    expect(result.success).toBeDefined();
    expect(db.movieView.create).toHaveBeenCalled();
  });

  it('✅ sollte existierende View aktualisieren wenn heute schon vorhanden', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    (db.profil.findFirst as jest.Mock).mockResolvedValue({
      id: 'profil1',
      inUse: true,
    });
    (db.movieView.findFirst as jest.Mock).mockResolvedValue({
      id: 'view1',
      movieId: 'movie123',
      count: 1,
    });

    const result = await addMovieView({ movieId: 'movie123' });

    expect(result.success).toBeDefined();
    // Action erstellt NICHT wenn view bereits existiert
    expect(db.movieView.findFirst).toHaveBeenCalled();
    expect(db.movieView.create).not.toHaveBeenCalled();
  });
});
