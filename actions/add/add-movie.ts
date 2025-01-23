"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';

export const addMovie = async (values: z.infer<typeof MovieSchema>) => {
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

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration, movieVideo, movieThumbnail } = validatedField.data

  await db.movie.create({
    data: {
      title: movieName,
      description: movieDescripton,
      videoUrl: movieVideo,
      thumbnailUrl: movieThumbnail,
      type: movieType,
      genre: movieGenre,
      actor: movieActor,
      duration: movieDuration
    }
  })

  return { success: "Movie added!" }
}