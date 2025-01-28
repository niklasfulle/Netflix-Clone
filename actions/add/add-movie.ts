"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';

export const addMovie = async (values: z.infer<typeof MovieSchema>, thumbnailUrl: string) => {
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

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration, movieVideo } = validatedField.data


  await db.movie.create({
    data: {
      title: movieName,
      description: movieDescripton,
      videoUrl: movieVideo,
      thumbnailUrl: thumbnailUrl,
      type: movieType,
      genre: movieGenre,
      actor: movieActor,
      duration: movieDuration
    }
  })

  const actor = await db.actor.findFirst({
    where: {
      name: movieActor
    }
  })

  if (actor) {
    const movieCount = movieType == "Movie" ? 1 : 0
    const serieCount = movieType == "Serie" ? 1 : 0

    await db.actor.update({
      where: {
        id: actor.id
      },
      data: {
        movies: actor.movies + movieCount,
        series: actor.series + serieCount,
      }
    })

  } else {
    const movieCount = movieType == "Movie" ? 1 : 0
    const serieCount = movieType == "Serie" ? 1 : 0

    await db.actor.create({
      data: {
        name: movieActor,
        movies: movieCount,
        series: serieCount,
      }
    })
  }

  return { success: "Movie added!" }
}