"use server"
import { logBackendAction } from '@/lib/logger';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const deleteVideoFile = (videoUrl: string, type: string) => {
  const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
  const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";
  
  const baseFolder = type === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;
  const extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  
  for (const ext of extensions) {
    const filePath = path.join(
      /*turbopackIgnore: true*/ baseFolder,
      `${videoUrl}${ext}`,
    );
    if (fs.existsSync(/* turbopackIgnore: true */ filePath)) {
      fs.unlinkSync(/* turbopackIgnore: true */ filePath);
      break;
    }
  }
};

const cleanupOrphanedActors = async (
  movieActors: Array<{ actor: { id: string } }>,
) => {
  for (const movieActor of movieActors) {
    const actor = movieActor.actor;
    const remainingMovieCount = await db.movieActor.count({
      where: {
        actorId: actor.id,
        movie: { type: "Movie" },
      },
    });
    const remainingSerieCount = await db.movieActor.count({
      where: {
        actorId: actor.id,
        movie: { type: "Serie" },
      },
    });

    if (remainingMovieCount === 0 && remainingSerieCount === 0) {
      await db.actor.delete({
        where: { id: actor.id },
      });
    }
  }
};

export const deleteMovie = async (movieId: string) => {
  const audit = adminMutationAudit.begin('content.delete');
  const user = await currentUser()
  const role = await currentRole()

  if (!user) {
    logBackendAction('deleteMovie_unauthorized', { movieId }, 'error');
    await audit.denied();
    return { error: "Unauthorized!" }
  }

  if (role !== UserRole.ADMIN) {
    logBackendAction('deleteMovie_not_allowed', { userId: user.id, role, movieId }, 'error');
    await audit.denied();
    return { error: "Not allowed Server Action!" }
  }

  try {
    logBackendAction('deleteMovie_called', { userId: user.id, role, movieId }, 'info');
    const movie = await db.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      logBackendAction('deleteMovie_not_found', { userId: user.id, movieId }, 'error');
      await audit.failed({ target: { type: 'content', id: movieId } });
      return { error: "Movie not found!" }
    }

    if (movie.videoUrl) {
      deleteVideoFile(movie.videoUrl, movie.type);
    }

    const movieActors = await db.movieActor.findMany({
      where: { movieId },
      include: { actor: true },
    });

    await db.$transaction([
      db.movieActor.deleteMany({ where: { movieId } }),
      db.movie.delete({ where: { id: movieId } }),
    ]);

    await cleanupOrphanedActors(movieActors);

    logBackendAction('deleteMovie_success', { userId: user.id, movieId }, 'info');
    await audit.succeeded({
      target: { type: 'content', id: movieId },
      metadata: { contentType: movie.type, previousStatus: movie.status },
    });
    return { success: "Movie deleted successfully!" }
  } catch (error) {
    logBackendAction('deleteMovie_error', { userId: user?.id, movieId, error: String(error) }, 'error');
    console.error("Delete movie error:", error);
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: "Failed to delete movie!" }
  }
}
