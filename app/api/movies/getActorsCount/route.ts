import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Movie } from '@prisma/client';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_movies_getActorsCount_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_movies_getActorsCount_no_profil', { userId: user.id }, 'error');
      return Response.json(null, { status: 404 })
    }

    const movies = await db.movie.findMany({
      where: {
        type: "Movie"
      },
      orderBy: {
        id: "asc",
      },
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    });

    const actors = new Set<string>();
    movies.forEach((movie) => {
      movie.actors.forEach((ma: any) => {
        if (ma.actor && ma.actor.name) {
          actors.add(ma.actor.name);
        }
      });
    });

    const actorArray: string[] = Array.from(actors);

    db.$disconnect()
    logBackendAction('api_movies_getActorsCount_success', { userId: user.id, profilId: profil.id, count: actorArray.length }, 'info');
    return Response.json(actorArray.length, { status: 200 })
  } catch (error) {
    logBackendAction('api_movies_getActorsCount_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}