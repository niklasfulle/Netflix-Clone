import { logBackendAction } from '@/lib/logger';
import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

type Params = {
  movieId: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { movieId } = await context.params

    if (typeof movieId !== "string" || !movieId) {
      logBackendAction('api_favorites_movieid_invalid_id', { movieId }, 'error');
      throw new Error("Invalid ID")
    }

    const user = await currentUser()

    if (!user) {
      logBackendAction('api_favorites_movieid_no_user', { movieId }, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_favorites_movieid_no_profil', { userId: user.id, movieId }, 'error');
      return Response.json(null, { status: 404 })
    }

    const movies = await db.movie.findMany({
      where: {
        id: {
          in: profil.favoriteIds
        }
      },
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    });

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: movieId,
      }
    })

    // Build response array with required shape
    const responseMovies = movies.map((movie) => {
      const actorNames = movie.actors.map((ma: any) => ma.actor.name).join(", ");
      const timeObj = watchTime.find((t) => t.movieId === movie.id);
      return {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        videoUrl: movie.videoUrl,
        thumbnailUrl: movie.thumbnailUrl,
        type: movie.type,
        genre: movie.genre,
        actor: actorNames,
        duration: movie.duration,
        createdAt: movie.createdAt,
        watchTime: timeObj ? timeObj.time : undefined,
      };
    });

    db.$disconnect();
    logBackendAction('api_favorites_movieid_success', { userId: user.id, profilId: profil.id, movieId }, 'info');
    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    logBackendAction('api_favorites_movieid_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
