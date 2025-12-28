import { logBackendAction } from '@/lib/logger';
import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Actor } from '@prisma/client';

export const dynamic = "force-dynamic"

type Params = {
  limit: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { limit } = await context.params
    const param = limit.split("_")
    const start = Number(param[0])
    const limitNum = Number(param[1])
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_movies_getActors_limit_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      logBackendAction('api_movies_getActors_limit_no_profil', { userId: user.id }, 'error');
      return Response.json(null, { status: 404 })
    }

    // Find actors who have at least one movie (movie.type === 'Movie')
    const actors = await db.actor.findMany({
      where: {
        movies: {
          some: {
            movie: {
              type: 'Movie',
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip: start,
      take: limitNum,
      include: {
        movies: {
          include: {
            movie: true,
          },
        },
      },
    });

    const actorArray: string[] = actors.map((actor: Actor) => actor.name);
    logBackendAction('api_movies_getActors_limit_success', { userId: user.id, profilId: profil.id, count: actorArray.length }, 'info');
    return Response.json(actorArray, { status: 200 })
  } catch (error) {
    logBackendAction('api_movies_getActors_limit_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}