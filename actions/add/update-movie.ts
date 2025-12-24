"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';

export const updateMovie = async (movieId: string, values: z.infer<typeof MovieSchema>, thumbnailUrl: string) => {
  const user = await currentUser()
  const role = await currentRole()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  if (role !== UserRole.ADMIN) {
    return { error: "Not allowed Server Action!" }
  }

  const validatedField = MovieSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

  const movie = await db.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    return { error: "Movie not found!" }
  }

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration, movieVideo } = validatedField.data

  // Update Movie-Daten (ohne actor)
  await db.movie.update({
    where: { id: movieId },
    data: {
      title: movieName,
      description: movieDescripton,
      type: movieType,
      genre: movieGenre,
      duration: movieDuration,
      videoUrl: movieVideo,
      thumbnailUrl: thumbnailUrl
    }
  })

  // Alle bisherigen Actor-Relationen löschen
  await db.movieActor.deleteMany({ where: { movieId } });

  // Neue Actor-Relationen anlegen
  if (Array.isArray(movieActor)) {
    for (const actorId of movieActor) {
      await db.movieActor.create({ data: { movieId, actorId } });
    }
  }

  return { success: "Movie updated!" }
}