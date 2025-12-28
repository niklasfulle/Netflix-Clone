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

    if (!movieId) {
      logBackendAction('api_movies_movieid_no_id', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const user = await currentUser()

    if (!user) {
      logBackendAction('api_movies_movieid_no_user', { movieId }, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_movies_movieid_no_profil', { userId: user.id, movieId }, 'error');
      return Response.json(null, { status: 404 })
    }


    const movie = await db.movie.findUnique({
      where: { id: movieId },
      include: {
        actors: {
          include: {
            actor: true
          }
        }
      }
    });

    if (!movie) {
      logBackendAction('api_movies_movieid_not_found', { userId: user.id, movieId }, 'error');
      return Response.json(null, { status: 404 }) 
    }

    // Collect all actor objects and IDs
    const actorObjs = movie.actors.map(ma => ({ id: ma.actor.id, name: ma.actor.name }));
    const actorIds = actorObjs.map(a => a.id);

    // Remove old actor field if present, and always return actors as array of objects and IDs
    const movieWithWatchTime: any = {
      ...movie,
      actors: actorObjs,
      actorIds,
      watchTime: undefined,
    };

    const movieWatchTime = await db.movieWatchTime.findFirst({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: movie.id
      }
    })

    if (movieWatchTime) {
      movieWithWatchTime.watchTime = movieWatchTime.time;
    }
    db.$disconnect();
    logBackendAction('api_movies_movieid_success', { userId: user.id, movieId }, 'info');
    return Response.json(movieWithWatchTime, { status: 200 });
  } catch (error) {
    logBackendAction('api_movies_movieid_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}