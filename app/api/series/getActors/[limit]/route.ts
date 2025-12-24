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

    // Find actors who have at least one series (movie.type === 'Serie' or 'Series')
    const actors = await db.actor.findMany({
      where: {
        movies: {
          some: {
            movie: {
              OR: [
                { type: 'Serie' },
                { type: 'Series' },
              ],
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
    return Response.json(actorArray, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}