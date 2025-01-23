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

    const series = await db.movie.findMany({
      where: {
        type: "Serie"
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
    })

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
      }
    })

    for (let i = 0; i < series.length; i++) {
      for (const time of watchTime) {
        const movieWithWatchTime: {
          id: string;
          title: string;
          description: string;
          videoUrl: string;
          thumbnailUrl: string;
          type: string;
          genre: string;
          actor: string;
          duration: string;
          createdAt: Date;
          watchTime?: number;
        } = { ...series[i], watchTime: undefined };

        if (series[i].id == time.movieId) {
          movieWithWatchTime.watchTime = time.time
          series[i] = movieWithWatchTime
        }
      }
    }

    db.$disconnect()
    return Response.json(series, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
