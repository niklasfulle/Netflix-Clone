"use server"

import { UserRole } from '@prisma/client';
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { db } from '@/lib/db';
import { isGenreAllowed } from '@/lib/genres';
import { logBackendAction } from '@/lib/logger';
import { parseMediaType, stageMediaTypeChange } from '@/lib/media-library';
import { MovieSchema } from '@/schemas';

type StagedMove = Awaited<ReturnType<typeof stageMediaTypeChange>>;

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

async function rollbackStagedMove(stagedMove: StagedMove) {
  try {
    await stagedMove?.rollback();
  } catch {
    // The original file is still present; the transaction failure is logged by the caller.
  }
}

export const updateMovie = async (
  movieId: string,
  values: z.infer<typeof MovieSchema>,
  thumbnailUrl: string,
) => {
  const audit = adminMutationAudit.begin('content.update');
  const user = await currentUser();
  const role = await currentRole();

  if (!user) {
    logBackendAction('updateMovie_unauthorized', { movieId }, 'error');
    await audit.denied();
    return { error: "Unauthorized!" };
  }
  if (role !== UserRole.ADMIN) {
    logBackendAction('updateMovie_not_allowed', { userId: user.id, role, movieId }, 'error');
    await audit.denied();
    return { error: "Not allowed Server Action!" };
  }

  const validatedField = MovieSchema.safeParse(values);
  if (!validatedField.success) {
    logBackendAction('updateMovie_invalid_fields', {
      userId: user.id,
      movieId,
      invalidFields: validatedField.error.issues.map((issue) => issue.path.join('.')),
    }, 'error');
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: "Invalid fields!" };
  }

  const {
    movieName,
    movieDescripton,
    movieActor,
    movieType,
    movieGenre,
    movieDuration,
    movieVideo,
  } = validatedField.data;
  if (!isGenreAllowed(movieGenre)) {
    logBackendAction('updateMovie_genre_not_allowed', { userId: user.id, movieId, movieGenre }, 'warn');
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: "Genre is not allowed!" };
  }

  const movie = await db.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: "Movie not found!" };
  }

  let stagedMove: StagedMove;
  try {
    stagedMove = await stageMediaTypeChange({
      currentType: parseMediaType(movie.type),
      targetType: parseMediaType(movieType),
      videoUrl: movie.videoUrl,
    });
  } catch (error) {
    logBackendAction('updateMovie_media_stage_failed', {
      userId: user.id,
      movieId,
      errorName: getErrorName(error),
    }, 'error');
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: error instanceof Error ? error.message : "Video file could not be moved!" };
  }

  try {
    await db.$transaction(async (transaction) => {
      await transaction.movie.update({
        where: { id: movieId },
        data: {
          title: movieName,
          description: movieDescripton,
          type: movieType,
          genre: movieGenre,
          duration: movieDuration,
          videoUrl: stagedMove?.videoName ?? movieVideo,
          thumbnailUrl,
        },
      });
      await transaction.movieActor.deleteMany({ where: { movieId } });
      if (movieActor.length > 0) {
        await transaction.movieActor.createMany({
          data: movieActor.map((actorId) => ({ movieId, actorId })),
          skipDuplicates: true,
        });
      }
    });
  } catch (error) {
    await rollbackStagedMove(stagedMove);
    logBackendAction('updateMovie_transaction_failed', {
      userId: user.id,
      movieId,
      errorName: getErrorName(error),
    }, 'error');
    await audit.failed({ target: { type: 'content', id: movieId } });
    return { error: "Movie could not be updated!" };
  }

  try {
    await stagedMove?.commit();
  } catch (error) {
    logBackendAction('updateMovie_source_cleanup_failed', {
      userId: user.id,
      movieId,
      errorName: getErrorName(error),
    }, 'warn');
  }

  logBackendAction('updateMovie_success', { userId: user.id, movieId }, 'info');
  await audit.succeeded({
    target: { type: 'content', id: movieId },
    metadata: {
      changedFields: [
        'title',
        'description',
        'type',
        'genre',
        'duration',
        'videoUrl',
        'thumbnailUrl',
        'actors',
      ],
    },
  });
  return { success: "Movie updated!" };
}
