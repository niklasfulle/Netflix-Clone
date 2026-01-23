import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      logBackendAction('api_random_route_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }

    const movieCount = await db.movie.count()
    if (movieCount === 0) {
      logBackendAction('api_random_route_no_movies_in_db', { userId: user.id }, 'error');
      db.$disconnect();
      return Response.json(null, { status: 200 });
    }
    // Math.random() is safe here because this endpoint is not security-critical and does not expose sensitive data based on randomness.
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
      logBackendAction('api_random_route_no_movie', { userId: user.id }, 'error');
      return Response.json(null, { status: 200 })
    }
    // Serialisiere Date-Objekte explizit
    const movie = randomMovies[0]
    const serializedMovie = {
      ...movie,
      createdAt: movie.createdAt?.toISOString?.() ?? movie.createdAt,
    };
    logBackendAction('api_random_route_success', { userId: user.id, movieId: movie.id }, 'info');
    return Response.json(serializedMovie, { status: 200 });
  } catch (error) {
    logBackendAction('api_random_route_error', { error: String(error) }, 'error');
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}