import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Actor } from '@prisma/client';

export const dynamic = "force-dynamic"

type Params = {
  limit: string
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const param = params.limit.split("_")
    const start = Number(param[0])
    const limit = Number(param[1])

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

    const actors = await db.actor.findMany({
      where: {
        series: {
          gt: 0,
        }
      },
      orderBy: {
        name: "asc",
      },
      skip: start,
      take: limit,
    })

    const actorArray: string[] = []
    actors.forEach((actor: Actor) => actorArray.push(actor.name));

    db.$disconnect()

    return Response.json(actorArray, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}