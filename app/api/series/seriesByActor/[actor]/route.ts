import { NextRequest } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

type Params = {
  actor: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { actor } = await context.params

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


    // Find all series where the actor is linked via MovieActor join table
    const series = await db.movie.findMany({
      where: {
        type: 'Serie',
        actors: {
          some: {
            actor: {
              name: actor,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    });

    series.reverse();

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
      }
    })

    // Build response array with required shape
    const responseSeries = series.map((serie) => {
      const actorNames = serie.actors.map((ma: any) => ma.actor.name).join(", ");
      const timeObj = watchTime.find((t) => t.movieId === serie.id);
      return {
        id: serie.id,
        title: serie.title,
        description: serie.description,
        videoUrl: serie.videoUrl,
        thumbnailUrl: serie.thumbnailUrl,
        type: serie.type,
        genre: serie.genre,
        actor: actorNames,
        duration: serie.duration,
        createdAt: serie.createdAt,
        watchTime: timeObj ? timeObj.time : undefined,
      };
    });
    db.$disconnect();
    return Response.json(responseSeries, { status: 200 });
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}