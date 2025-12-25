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
      take: 20,
      include: {
        actors: {
          include: {
            actor: true,
          },
        },
      },
    });

    movies.reverse();

    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
      }
    })

    // Build response array with required shape
    const responseMovies = movies.map((movie) => {
      const actorNames = movie.actors.map((ma: any) => ma.actor.name).join(", ");
      const timeObj = watchTime.find((t) => t.movieId === movie.id);
      return {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        videoUrl: movie.videoUrl,
        thumbnailUrl: movie.thumbnailUrl,
        type: movie.type,
        genre: movie.genre,
        actor: actorNames,
        duration: movie.duration,
        createdAt: movie.createdAt,
        watchTime: timeObj ? timeObj.time : undefined,
      };
    });
    db.$disconnect();
    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}
