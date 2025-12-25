import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return Response.json(null, { status: 404 })
    }

    const movieCount = await db.movie.count()
    const randomIndex = Math.floor(Math.random() * movieCount)

    const randomMovies = await db.movie.findMany({
      take: 1,
      skip: randomIndex,
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        type: true,
        genre: true,
        duration: true,
        createdAt: true,
      },
    });

    db.$disconnect()
    // Prüfe, ob ein Movie gefunden wurde
    if (!randomMovies[0]) {
      return Response.json(null, { status: 200 })
    }
    // Serialisiere Date-Objekte explizit
    const movie = randomMovies[0]
    const serializedMovie = {
      ...movie,
      createdAt: movie.createdAt?.toISOString?.() ?? movie.createdAt,
    };
    return Response.json(serializedMovie, { status: 200 });
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}