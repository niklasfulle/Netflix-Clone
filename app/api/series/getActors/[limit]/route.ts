import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"
import { NextRequest } from "next/server"
import { Movie } from "@prisma/client"

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

    const takeLimit = limit ? parseInt(limit as string) : 5;

    const movies = await db.movie.findMany({
      where: {
        type: "Serie"
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
    return Response.json(actorArray.sort().slice(0, takeLimit), { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}