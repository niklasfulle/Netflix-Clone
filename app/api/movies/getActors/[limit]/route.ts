import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Movie } from '@prisma/client';

export const dynamic = "force-dynamic"

type Params = {
  limit: string
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const limit = params.limit

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

    const takeLimit = limit ? parseInt(limit) : 5;

    const movies = await db.movie.findMany({
      where: {
        type: "Movie"
      },
      orderBy: {
        id: "asc",
      },
    })

    const actors = new Set<string>([])
    movies.forEach((movie: Movie) => actors.add(movie.actor));

    const actorArray: string[] = []
    actors.forEach((actor: string) => actorArray.push(actor));


    db.$disconnect()
    actorArray.sort();
    return Response.json(actorArray.slice(0, takeLimit), { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}