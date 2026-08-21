jest.mock('@/lib/auth', () => ({ currentUser: jest.fn(), currentRole: jest.fn() }));
jest.mock('@/lib/genres', () => ({ isGenreAllowed: jest.fn(() => true) }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/media-library', () => ({
  parseMediaType: jest.fn((value: string) => value),
  stageMediaTypeChange: jest.fn(),
}));
jest.mock('@/lib/db', () => ({
  db: {
    movie: { findUnique: jest.fn() },
    adminAuditEvent: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { UserRole } from '@prisma/client';

import { updateMovie } from '../update-movie';
import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isGenreAllowed } from '@/lib/genres';
import { stageMediaTypeChange } from '@/lib/media-library';

const values = {
  movieName: 'Updated Title',
  movieDescripton: 'Updated Description',
  movieType: 'Serie',
  movieGenre: 'Drama',
  movieDuration: '02:30:00',
  movieVideo: 'video',
  movieActor: ['actor-1', 'actor-2'],
};

describe('updateMovie', () => {
  const transaction = {
    movie: { update: jest.fn() },
    movieActor: { deleteMany: jest.fn(), createMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue({
      id: 'user-1', email: 'admin@example.com', role: UserRole.ADMIN,
    });
    (currentRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);
    (isGenreAllowed as jest.Mock).mockReturnValue(true);
    (db.movie.findUnique as jest.Mock).mockResolvedValue({
      id: 'movie-1', type: 'Movie', videoUrl: 'video.mp4',
    });
    (db.$transaction as jest.Mock).mockImplementation(async (callback) => callback(transaction));
    (stageMediaTypeChange as jest.Mock).mockResolvedValue(null);
  });

  it('rejects unauthenticated and non-admin users before database writes', async () => {
    (currentUser as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({ error: 'Unauthorized!' });
    expect(db.$transaction).not.toHaveBeenCalled();

    (currentRole as jest.Mock).mockResolvedValueOnce(UserRole.USER);
    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({
      error: 'Not allowed Server Action!',
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid fields, disallowed genres, and missing movies', async () => {
    await expect(updateMovie('movie-1', { ...values, movieName: '' }, 'thumb.jpg')).resolves.toEqual({
      error: 'Invalid fields!',
    });

    (isGenreAllowed as jest.Mock).mockReturnValueOnce(false);
    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({
      error: 'Genre is not allowed!',
    });

    (db.movie.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({
      error: 'Movie not found!',
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('updates metadata and actor relations in one transaction', async () => {
    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({
      success: 'Movie updated!',
    });

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.movie.update).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
      data: expect.objectContaining({ title: 'Updated Title', type: 'Serie' }),
    });
    expect(transaction.movieActor.deleteMany).toHaveBeenCalledWith({ where: { movieId: 'movie-1' } });
    expect(transaction.movieActor.createMany).toHaveBeenCalledWith({
      data: [
        { movieId: 'movie-1', actorId: 'actor-1' },
        { movieId: 'movie-1', actorId: 'actor-2' },
      ],
      skipDuplicates: true,
    });
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'content.update',
        actorUserId: 'user-1',
        targetId: 'movie-1',
        outcome: 'SUCCEEDED',
        correlationId: expect.any(String),
        metadata: { changedFields: ['title', 'description', 'type', 'genre', 'duration', 'videoUrl', 'thumbnailUrl', 'actors'] },
      }),
    });
  });

  it('commits a staged media move only after the database transaction succeeds', async () => {
    const staged = { videoName: 'video', commit: jest.fn(), rollback: jest.fn() };
    (stageMediaTypeChange as jest.Mock).mockResolvedValue(staged);

    await updateMovie('movie-1', values, 'thumb.jpg');

    expect(transaction.movie.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ videoUrl: 'video' }),
    }));
    expect(staged.commit).toHaveBeenCalledTimes(1);
    expect(staged.rollback).not.toHaveBeenCalled();
  });

  it('rolls a staged media move back when metadata or actor updates fail', async () => {
    const staged = { videoName: 'video', commit: jest.fn(), rollback: jest.fn() };
    (stageMediaTypeChange as jest.Mock).mockResolvedValue(staged);
    (db.$transaction as jest.Mock).mockRejectedValueOnce(new Error('actor failure'));

    await expect(updateMovie('movie-1', values, 'thumb.jpg')).resolves.toEqual({
      error: 'Movie could not be updated!',
    });
    expect(staged.rollback).toHaveBeenCalledTimes(1);
    expect(staged.commit).not.toHaveBeenCalled();
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'content.update',
        targetId: 'movie-1',
        outcome: 'FAILED',
      }),
    });
  });
});
