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

    // Baue ein neues Array mit actors: string[]
    const responseSeries = series.map((serie) => {
      const actorNames = serie.actors?.map((a: any) => a.actor.name) || [];
      const time = watchTime.find((t) => t.movieId === serie.id);
      return {
        ...serie,
        actors: actorNames,
        ...(time ? { watchTime: time.time } : {}),
      };
    });
    db.$disconnect()
    return Response.json(responseSeries, { status: 200 })

    db.$disconnect()
    return Response.json(series, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
