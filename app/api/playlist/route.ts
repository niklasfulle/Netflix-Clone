import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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

    const playlists = await db.playlist.findMany({
      where: {
        userId: user.id as string,
        profilId: profil.id
      },
      orderBy: {
        createdAt: "asc"
      }
    })


    const playlistsWithEntries: any = []
    for (const playlist of playlists) {
      const playlistsEntries = await db.playlistEntry.findMany({
        where: {
          playlistId: playlist.id
        },
        orderBy: {
          order: 'asc',
        },
      })

      const movies: any = []
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

      playlistsWithEntries.push(playlistWithEntries)
    }

    db.$disconnect()
    return Response.json(playlistsWithEntries, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
