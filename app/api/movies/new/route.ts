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

    const movies = await db.movie.findMany({
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

    // Baue ein neues Array mit actors: {id, name}[]
    const responseMovies = movies.map((movie) => {
      const actorObjs = movie.actors?.map((a: any) => ({ id: a.actor.id, name: a.actor.name })) || [];
      const time = watchTime.find((t) => t.movieId === movie.id);
      return {
        ...movie,
        actors: actorObjs,
        ...(time ? { watchTime: time.time } : {}),
      };
    });

    db.$disconnect()
    return Response.json(responseMovies, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
