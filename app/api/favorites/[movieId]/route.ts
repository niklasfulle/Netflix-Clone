import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

type Params = {
  movieId: string
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const movieId = params.movieId

    if (typeof movieId !== "string") {
      throw new Error("Invalid ID")
    }

    if (!movieId) {
      throw new Error("Invalid ID")
    }

    const user = await currentUser()

    if (!user) {
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      return Response.json(null, { status: 404 })
    }

    const movies = await db.movie.findMany({
      where: {
        id: {
          in: profil.favoriteIds
        }
      }
    })

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: movieId,
      }
    })

    for (let i = 0; i < movies.length; i++) {
      for (const time of watchTime) {
        const movieWithWatchTime: {
          id: string;
          title: string;
          description: string;
          videoUrl: string;
          thumbnailUrl: string;
          type: string;
          genre: string;
          actor: string;
          duration: string;
          createdAt: Date;
          watchTime?: number;
        } = { ...movies[i], watchTime: undefined };

        if (movies[i].id == time.movieId) {
          movieWithWatchTime.watchTime = time.time
          movies[i] = movieWithWatchTime
        }
      }
    }

    db.$disconnect()
    return Response.json(movies, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
