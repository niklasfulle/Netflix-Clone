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
      where: {
        type: "Movie"
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

    // Map movie id to watchTime
    const watchTimeMap = new Map<string, number>();
    for (const wt of watchTime) {
      watchTimeMap.set(wt.movieId, wt.time);
    }

    // Build response array with correct types
    const moviesResponse = movies.map((movie: any) => {
      const actorNames = movie.actors?.map((a: any) => a.actor.name) || [];
      const wt = watchTimeMap.get(movie.id);
      return {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        videoUrl: movie.videoUrl,
        thumbnailUrl: movie.thumbnailUrl,
        type: movie.type,
        genre: movie.genre,
        actors: actorNames,
        duration: movie.duration,
        createdAt: movie.createdAt,
        ...(wt !== undefined ? { watchTime: wt } : {}),
      };
    });

    db.$disconnect()
    return Response.json(moviesResponse, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
