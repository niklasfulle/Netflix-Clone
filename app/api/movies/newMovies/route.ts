import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_movies_newMovies_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_movies_newMovies_no_profil', { userId: user.id }, 'error');
      return Response.json(null, { status: 404 })
    }

    const movies = await db.movie.findMany({
      where: {
        type: "Movie"
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    })

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
      }
    })

    // Map movie id to watchTime
    const watchTimeMap = new Map<string, number>();
    for (const wt of watchTime) {
      watchTimeMap.set(wt.movieId, wt.time);
    }

    // Build response array with correct types
    const moviesResponse = movies.map((movie: any) => {
      const actorNames = movie.actors?.map((a: any) => a.actor.name) || [];
      const wt = watchTimeMap.get(movie.id);
      const movieObj: any = {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        videoUrl: movie.videoUrl,
        thumbnailUrl: movie.thumbnailUrl,
        type: movie.type,
        genre: movie.genre,
        actors: actorNames,
        duration: movie.duration,
        createdAt: movie.createdAt,
      };
      if (wt === undefined) {
        // Do not add watchTime if undefined
      } else {
        movieObj.watchTime = wt;
      }
      return movieObj;
    });

    db.$disconnect()
    logBackendAction('api_movies_newMovies_success', { userId: user.id, profilId: profil.id, count: moviesResponse.length }, 'info');
    return Response.json(moviesResponse, { status: 200 })
  } catch (error) {
    logBackendAction('api_movies_newMovies_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
