import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_favorites_route_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_favorites_route_no_profil', { userId: user.id }, 'error');
      return Response.json(null, { status: 404 })
    }

    const movies = await db.movie.findMany({
      where: {
        id: {
          in: profil?.favoriteIds
        }
      },
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

    const responseMovies = movies.map((movie) => {
      const actorNames = movie.actors?.map((a: any) => a.actor.name) || [];
      const time = watchTime.find((t) => t.movieId === movie.id);
      return {
        ...movie,
        actors: actorNames,
        ...(time ? { watchTime: time.time } : {}),
      };
    });
    db.$disconnect()
    logBackendAction('api_favorites_route_success', { userId: user.id, profilId: profil.id, count: responseMovies.length }, 'info');
    return Response.json(responseMovies, { status: 200 })

    db.$disconnect()
    return Response.json(movies, { status: 200 })
  } catch (error) {
    logBackendAction('api_favorites_route_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}