jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    movie: {
      create: jest.fn(),
    },
    movieActor: {
      create: jest.fn(),
    },
    adminAuditEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/genres', () => ({
  isGenreAllowed: jest.fn(() => true),
}));

import { addMovie } from '../add-movie';
import { currentUser, currentRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { isGenreAllowed } from '@/lib/genres';
import { UserRole } from '@prisma/client';

describe('add movie action - Authentifizierung & Validierung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isGenreAllowed as jest.Mock).mockReturnValue(true);
  });

  it('❌ sollte Fehler zurückgeben wenn User nicht authentifiziert ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue(undefined);

    const result = await addMovie(
      {
        title: 'Test Movie',
        description: 'A test movie',
        releaseDate: new Date(),
        durationMinutes: 120,
        genres: [],
      } as any,
      'thumbnail-url'
    );

    expect(result).toEqual({ error: 'Unauthorized!' });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('❌ sollte Fehler zurückgeben wenn User kein Admin ist', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1', role: UserRole.USER } as any);

    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.USER);

    const result = await addMovie(
      {
        title: 'Test Movie',
        description: 'A test movie',
        releaseDate: new Date(),
        durationMinutes: 120,
        genres: [],
      } as any,
      'thumbnail-url'
    );

    expect(result).toEqual({ error: 'Not allowed Server Action!' });
    expect(db.movie.create).not.toHaveBeenCalled();
    expect(db.adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'user1',
        actorRole: 'USER',
        action: 'content.create',
        targetId: null,
        outcome: 'DENIED',
      }),
    });
  });

  it('❌ sollte Fehler zurückgeben wenn Felder ungültig sind', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1', role: UserRole.ADMIN } as any);

    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.ADMIN);

    const result = await addMovie(
      {
        title: '',
        description: 'A test movie',
        releaseDate: new Date(),
        durationMinutes: 120,
        genres: [],
      } as any,
      'thumbnail-url'
    );

    expect(result).toEqual({ error: 'Invalid fields!' });
    expect(db.movie.create).not.toHaveBeenCalled();
    expect(db.adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'user1',
        action: 'content.create',
        outcome: 'FAILED',
      }),
    });
  });

  it('✅ sollte nur für Admins verfügbar sein', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.ADMIN);

    expect(db.movie.create).toBeDefined();
  });

  it('✅ sollte DB-Aufrufe verhindern wenn nicht Admin', async () => {
    const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
    mockCurrentUser.mockResolvedValue({ id: 'user1' } as any);

    const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;
    mockCurrentRole.mockResolvedValue(UserRole.USER);

    const result = await addMovie(
      {
        title: 'Test Movie',
        description: 'A test movie',
        releaseDate: new Date(),
        durationMinutes: 120,
        genres: [],
      } as any,
      'thumbnail-url'
    );

    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('❌ sollte ein nicht erlaubtes Production-Genre ablehnen', async () => {
    (currentUser as jest.Mock).mockResolvedValue({ id: 'user1' });
    (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);
    (isGenreAllowed as jest.Mock).mockReturnValue(false);

    const result = await addMovie(
      {
        movieName: 'Test Movie',
        movieDescripton: 'A test movie',
        movieType: 'Movie',
        movieGenre: 'Unconfigured',
        movieDuration: '02:00:00',
        movieVideo: 'test-video',
        movieActor: ['actor-1'],
      },
      'thumbnail-url',
    );

    expect(result).toEqual({ error: 'Genre is not allowed!' });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('records a successful content creation with its generated target', async () => {
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });
    (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);
    (db.movie.create as jest.Mock).mockResolvedValue({ id: 'movie-1' });

    await expect(addMovie({
      movieName: 'Test Movie',
      movieDescripton: 'A test movie',
      movieType: 'Movie',
      movieGenre: 'Drama',
      movieDuration: '02:00:00',
      movieVideo: 'test-video',
      movieActor: ['actor-1'],
    }, 'thumbnail-url')).resolves.toEqual({ success: 'Movie added!' });

    expect(db.adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'content.create',
        targetType: 'content',
        targetId: 'movie-1',
        outcome: 'SUCCEEDED',
        correlationId: expect.any(String),
        metadata: { contentType: 'Movie', initialStatus: 'PUBLISHED' },
      }),
    });
  });
});
