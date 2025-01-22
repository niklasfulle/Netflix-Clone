import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

type Params = {
  playlistId: string
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const playlistId = params.playlistId

    if (!playlistId) {
      return Response.json(null, { status: 404 })
    }

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

    const playlist = await db.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return Response.json(null, { status: 404 })
    }


    var playlistsWithEntries: any
    const playlistsEntries = await db.playlistEntry.findMany({
      where: {
        playlistId: playlist.id
      },
      orderBy: {
        order: 'asc',
      },
    })

    var movies: any = []
    for (let i = 0; i < playlistsEntries.length; i++) {
      const movie = await db.movie.findUnique({
        where: {
          id: playlistsEntries[i].movieId
        }
      })

      movies[i] = movie
    }

    const playlistWithEntries: {
      id: string;
      userId: string;
      profilId: string
      title: string;

      movies: any
    } = { ...playlist, movies: movies };

    playlistsWithEntries = playlistWithEntries

    db.$disconnect()
    return Response.json(playlistsWithEntries, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}