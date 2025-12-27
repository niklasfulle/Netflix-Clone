"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';
import { logBackendAction } from '@/lib/logger';

export const addMovie = async (values: z.infer<typeof MovieSchema>, thumbnailUrl: string) => {
  const user = await currentUser();
  const role = await currentRole();

  logBackendAction('addMovie_called', {
    userId: user?.id,
    userEmail: user?.email,
    role,
    values,
    thumbnailUrl,
  });

  if (!user) {
    logBackendAction('addMovie_unauthorized', { values });
    return { error: "Unauthorized!" };
  }

  if (role !== UserRole.ADMIN) {
    logBackendAction('addMovie_not_allowed', { userId: user.id, role });
    return { error: "Not allowed Server Action!" };
  }

  const validatedField = MovieSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('addMovie_invalid_fields', { userId: user.id, values });
    return { error: "Invalid fields!" };
  }

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration, movieVideo } = validatedField.data;

  // Create the movie
  const createdMovie = await db.movie.create({
    data: {
      title: movieName,
      description: movieDescripton,
      videoUrl: movieVideo,
      thumbnailUrl: thumbnailUrl,
      type: movieType,
      genre: movieGenre,
      duration: movieDuration,
    }
  });

  // Connect all selected actors via MovieActor join table
  if (Array.isArray(movieActor) && movieActor.length > 0) {
    await Promise.all(
      movieActor.map((actorId: string) =>
        db.movieActor.create({
          data: {
            movieId: createdMovie.id,
            actorId,
          },
        })
      )
    );
  }

  return { success: "Movie added!" }
}