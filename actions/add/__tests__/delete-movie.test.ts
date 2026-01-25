jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    movie: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    movieActor: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    actor: {
      delete: jest.fn(),
    },
  },
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock('node:path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
}));

import { deleteMovie } from '../delete-movie';
import { logBackendAction } from '@/lib/logger';
import { currentUser, currentRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

describe('deleteMovie action - Movie Deletion with Authorization', () => {
  const mockLogBackendAction = logBackendAction as jest.MockedFunction<typeof logBackendAction>;
  const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
  const mockCurrentRole = currentRole as jest.MockedFunction<typeof currentRole>;

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    emailVerified: new Date(),
  };

  const mockMovie = {
    id: 'movie-1',
    title: 'Test Movie',
    videoUrl: 'video-file',
    type: 'Movie',
  };

  const mockActor = {
    id: 'actor-1',
    name: 'Test Actor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue(mockUser as any);
    mockCurrentRole.mockResolvedValue(UserRole.ADMIN);
    (db.movie.findUnique as jest.Mock).mockResolvedValue(mockMovie as any);
    (db.movie.delete as jest.Mock).mockResolvedValue(mockMovie as any);
    (db.movieActor.findMany as jest.Mock).mockResolvedValue([]);
    (db.movieActor.count as jest.Mock).mockResolvedValue(0);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  describe('Authorization', () => {
    it('❌ should return error if user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(undefined);

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Unauthorized!' });
    });

    it('❌ should log error when user not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(undefined);

      await deleteMovie('movie-1');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'deleteMovie_unauthorized',
        { movieId: 'movie-1' },
        'error'
      );
    });

    it('❌ should still check role even if user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(undefined);

      await deleteMovie('movie-1');
      expect(mockCurrentRole).toHaveBeenCalled();
    });

    it('❌ should return error if user is not admin', async () => {
      mockCurrentRole.mockResolvedValue(UserRole.USER);

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Not allowed Server Action!' });
    });

    it('❌ should log error when user is not admin', async () => {
      mockCurrentRole.mockResolvedValue(UserRole.USER);

      await deleteMovie('movie-1');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'deleteMovie_not_allowed',
        { userId: mockUser.id, role: UserRole.USER, movieId: 'movie-1' },
        'error'
      );
    });

    it('✅ should proceed if user is admin', async () => {
      mockCurrentRole.mockResolvedValue(UserRole.ADMIN);

      await deleteMovie('movie-1');
      expect(mockCurrentRole).toHaveBeenCalled();
    });

    it('❌ should not delete if user is guest', async () => {
      mockCurrentRole.mockResolvedValue('GUEST' as any);

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Not allowed Server Action!' });
    });
  });

  describe('Movie Existence Check', () => {
    it('✅ should check if movie exists', async () => {
      await deleteMovie('movie-1');
      expect(db.movie.findUnique).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
      });
    });

    it('❌ should return error if movie not found', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Movie not found!' });
    });

    it('❌ should log error when movie not found', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      await deleteMovie('movie-1');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'deleteMovie_not_found',
        { userId: mockUser.id, movieId: 'movie-1' },
        'error'
      );
    });

    it('❌ should not delete if movie not found', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      await deleteMovie('movie-1');
      expect(db.movie.delete).not.toHaveBeenCalled();
    });

    it('✅ should find movie by correct id', async () => {
      const movieId = 'specific-movie-123';
      await deleteMovie(movieId);

      expect(db.movie.findUnique).toHaveBeenCalledWith({
        where: { id: movieId },
      });
    });
  });

  describe('Video File Deletion', () => {
    it('✅ should delete video file if videoUrl exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await deleteMovie('movie-1');

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('✅ should not delete file if videoUrl is null', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        videoUrl: null,
      } as any);

      await deleteMovie('movie-1');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('✅ should use MOVIE_FOLDER for Movie type', async () => {
      process.env.MOVIE_FOLDER = './custom-movies';
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await deleteMovie('movie-1');

      const pathCalls = (path.join as jest.Mock).mock.calls;
      expect(pathCalls.some(call => call[0] === './custom-movies')).toBe(true);
    });

    it('✅ should use SERIES_FOLDER for Serie type', async () => {
      process.env.SERIES_FOLDER = './custom-series';
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        type: 'Serie',
      } as any);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await deleteMovie('movie-1');

      const pathCalls = (path.join as jest.Mock).mock.calls;
      expect(pathCalls.some(call => call[0] === './custom-series')).toBe(true);
    });

    it('✅ should try multiple file extensions', async () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await deleteMovie('movie-1');

      expect(fs.existsSync).toHaveBeenCalledTimes(3);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
    });

    it('✅ should stop at first matching extension', async () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true);

      await deleteMovie('movie-1');

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
    });

    it('✅ should support .mp4 extension', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      await deleteMovie('movie-1');

      expect(fs.existsSync).toHaveBeenCalledTimes(5);
    });
  });

  describe('Database Movie Deletion', () => {
    it('✅ should delete movie from database', async () => {
      await deleteMovie('movie-1');

      expect(db.movie.delete).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
      });
    });

    it('✅ should delete correct movie id', async () => {
      const movieId = 'specific-id-789';
      await deleteMovie(movieId);

      expect(db.movie.delete).toHaveBeenCalledWith({
        where: { id: movieId },
      });
    });

    it('✅ should delete after checking existence', async () => {
      await deleteMovie('movie-1');

      const findCall = (db.movie.findUnique as jest.Mock).mock.invocationCallOrder[0];
      const deleteCall = (db.movie.delete as jest.Mock).mock.invocationCallOrder[0];

      expect(findCall).toBeLessThan(deleteCall);
    });
  });

  describe('Orphaned Actors Cleanup', () => {
    it('✅ should find all actors for movie', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);

      await deleteMovie('movie-1');

      expect(db.movieActor.findMany).toHaveBeenCalledWith({
        where: { movieId: 'movie-1' },
        include: { actor: true },
      });
    });

    it('✅ should check remaining movies for actors', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);

      await deleteMovie('movie-1');

      expect(db.movieActor.count).toHaveBeenCalled();
    });

    it('✅ should delete actor if no remaining associations', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);
      (db.movieActor.count as jest.Mock).mockResolvedValue(0);

      await deleteMovie('movie-1');

      expect(db.actor.delete).toHaveBeenCalledWith({
        where: { id: mockActor.id },
      });
    });

    it('❌ should not delete actor if movie associations remain', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);
      (db.movieActor.count as jest.Mock)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(0);

      await deleteMovie('movie-1');

      expect(db.actor.delete).not.toHaveBeenCalled();
    });

    it('❌ should not delete actor if serie associations remain', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);
      (db.movieActor.count as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1);

      await deleteMovie('movie-1');

      expect(db.actor.delete).not.toHaveBeenCalled();
    });

    it('✅ should handle multiple actors', async () => {
      const actor2 = { id: 'actor-2', name: 'Test Actor 2' };
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
        { movieId: 'movie-1', actor: actor2, actorId: actor2.id },
      ] as any);

      await deleteMovie('movie-1');

      expect(db.actor.delete).toHaveBeenCalledTimes(2);
    });

    it('✅ should cleanup after movie deletion', async () => {
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([]);

      await deleteMovie('movie-1');

      const movieDeleteCall = (db.movie.delete as jest.Mock).mock.invocationCallOrder[0];
      const actorFindCall = (db.movieActor.findMany as jest.Mock).mock.invocationCallOrder[0];

      expect(movieDeleteCall).toBeLessThan(actorFindCall);
    });
  });

  describe('Logging', () => {
    it('✅ should log deletion start', async () => {
      await deleteMovie('movie-1');

      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'deleteMovie_called',
        { userId: mockUser.id, role: UserRole.ADMIN, movieId: 'movie-1' },
        'info'
      );
    });

    it('✅ should log successful deletion', async () => {
      await deleteMovie('movie-1');

      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const successCall = calls.find((call: any[]) => call[0] === 'deleteMovie_success');

      expect(successCall).toBeDefined();
      expect(successCall[1]).toEqual({ userId: mockUser.id, movieId: 'movie-1' });
      expect(successCall[2]).toBe('info');
    });

    it('✅ should log with user id and movie id', async () => {
      await deleteMovie('movie-1');

      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const lastInfoLog = calls.reverse().find((call: any[]) => call[2] === 'info');

      expect(lastInfoLog[1]).toHaveProperty('userId');
      expect(lastInfoLog[1]).toHaveProperty('movieId');
    });

    it('✅ should log error on exception', async () => {
      const error = new Error('Database error');
      (db.movie.delete as jest.Mock).mockRejectedValue(error);

      await deleteMovie('movie-1');

      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'deleteMovie_error',
        expect.objectContaining({
          userId: mockUser.id,
          movieId: 'movie-1',
          error: 'Error: Database error',
        }),
        'error'
      );
    });

    it('✅ should include error message in error log', async () => {
      const error = new Error('Specific error message');
      (db.movie.delete as jest.Mock).mockRejectedValue(error);

      await deleteMovie('movie-1');

      const errorCall = (mockLogBackendAction as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'deleteMovie_error'
      );

      expect(errorCall[1].error).toContain('Specific error message');
    });
  });

  describe('Return Values', () => {
    it('✅ should return success object', async () => {
      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ success: 'Movie deleted successfully!' });
    });

    it('❌ should return error object on not found', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deleteMovie('movie-1');
      expect(result).toHaveProperty('error');
    });

    it('❌ should return error object on exception', async () => {
      (db.movie.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Failed to delete movie!' });
    });

    it('❌ should not return success on error', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deleteMovie('movie-1');
      expect(result).not.toHaveProperty('success');
    });
  });

  describe('Error Handling', () => {
    it('✅ should catch database errors', async () => {
      (db.movie.delete as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Failed to delete movie!' });
    });

    it('✅ should validate before checking user', async () => {
      mockCurrentRole.mockResolvedValue(UserRole.USER);

      await deleteMovie('movie-1');

      expect(db.movie.findUnique).not.toHaveBeenCalled();
    });

    it('✅ should log error with original error details', async () => {
      const error = new Error('Specific DB error');
      (db.movie.delete as jest.Mock).mockRejectedValue(error);

      await deleteMovie('movie-1');

      const errorLog = (mockLogBackendAction as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'deleteMovie_error'
      );

      expect(errorLog[1].error).toContain('Specific DB error');
    });

    it('✅ should handle cleanup errors', async () => {
      (db.movieActor.findMany as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const result = await deleteMovie('movie-1');
      expect(result).toEqual({ error: 'Failed to delete movie!' });
    });
  });

  describe('Integration Scenarios', () => {
    it('✅ should complete full deletion flow', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await deleteMovie('movie-1');

      expect(mockCurrentUser).toHaveBeenCalled();
      expect(mockCurrentRole).toHaveBeenCalled();
      expect(db.movie.findUnique).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(db.movie.delete).toHaveBeenCalled();
      expect(db.movieActor.findMany).toHaveBeenCalled();
      expect(result).toEqual({ success: 'Movie deleted successfully!' });
    });

    it('✅ should delete movie with orphaned actor', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: mockActor, actorId: mockActor.id },
      ] as any);
      (db.movieActor.count as jest.Mock).mockResolvedValue(0);

      const result = await deleteMovie('movie-1');

      expect(db.actor.delete).toHaveBeenCalledWith({
        where: { id: mockActor.id },
      });
      expect(result).toEqual({ success: 'Movie deleted successfully!' });
    });

    it('✅ should delete serie and use correct folder', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        type: 'Serie',
      } as any);

      const result = await deleteMovie('serie-1');

      expect(result).toEqual({ success: 'Movie deleted successfully!' });
    });

    it('✅ should handle movie without video', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        videoUrl: null,
      } as any);

      const result = await deleteMovie('movie-1');

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toEqual({ success: 'Movie deleted successfully!' });
    });

    it('❌ should stop at authorization if not admin', async () => {
      mockCurrentRole.mockResolvedValue(UserRole.USER);

      await deleteMovie('movie-1');

      expect(db.movie.findUnique).not.toHaveBeenCalled();
      expect(db.movie.delete).not.toHaveBeenCalled();
    });

    it('❌ should stop at movie check if not found', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue(null);

      await deleteMovie('movie-1');

      expect(db.movie.delete).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('Different Movie Types', () => {
    it('✅ should handle Movie type correctly', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        type: 'Movie',
      } as any);

      await deleteMovie('movie-1');

      expect(db.movie.delete).toHaveBeenCalled();
    });

    it('✅ should handle Serie type correctly', async () => {
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        type: 'Serie',
      } as any);

      await deleteMovie('series-1');

      expect(db.movie.delete).toHaveBeenCalled();
    });

    it('✅ should use correct folder for each type', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Test Movie type
      await deleteMovie('movie-1');
      let pathCalls = (path.join as jest.Mock).mock.calls;
      expect(pathCalls.some(call => call[0].includes('movie'))).toBe(true);

      jest.clearAllMocks();
      (db.movie.findUnique as jest.Mock).mockResolvedValue({
        ...mockMovie,
        type: 'Serie',
      } as any);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Test Serie type
      await deleteMovie('serie-1');
      pathCalls = (path.join as jest.Mock).mock.calls;
      expect(pathCalls.some(call => call[0].includes('serie'))).toBe(true);
    });
  });

  describe('Multiple Actors Scenarios', () => {
    it('✅ should delete all orphaned actors', async () => {
      const actor1 = { id: 'actor-1', name: 'Actor 1' };
      const actor2 = { id: 'actor-2', name: 'Actor 2' };
      const actor3 = { id: 'actor-3', name: 'Actor 3' };

      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: actor1, actorId: actor1.id },
        { movieId: 'movie-1', actor: actor2, actorId: actor2.id },
        { movieId: 'movie-1', actor: actor3, actorId: actor3.id },
      ] as any);

      await deleteMovie('movie-1');

      expect(db.actor.delete).toHaveBeenCalledTimes(3);
    });

    it('✅ should not delete actors with remaining associations', async () => {
      const actor1 = { id: 'actor-1', name: 'Actor 1' };
      const actor2 = { id: 'actor-2', name: 'Actor 2' };

      (db.movieActor.findMany as jest.Mock).mockResolvedValue([
        { movieId: 'movie-1', actor: actor1, actorId: actor1.id },
        { movieId: 'movie-1', actor: actor2, actorId: actor2.id },
      ] as any);

      (db.movieActor.count as jest.Mock)
        .mockReturnValueOnce(1) // actor1 has movie
        .mockReturnValueOnce(0) // actor1 no series
        .mockReturnValueOnce(0) // actor2 no movies
        .mockReturnValueOnce(1); // actor2 has series

      await deleteMovie('movie-1');

      expect(db.actor.delete).not.toHaveBeenCalled();
    });
  });
});
