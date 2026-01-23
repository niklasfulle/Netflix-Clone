import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  getMoviesWithWatchTime,
  transformMoviesResponse,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { user, profil, error } = await getUserAndProfile('api_movies_route');
    if (error) return error;

    const { movies, watchTime } = await getMoviesWithWatchTime(
      'Movie',
      user.id,
      profil.id
    );

    const responseMovies = transformMoviesResponse(movies, watchTime);

    db.$disconnect();
    logBackendAction('api_movies_route_success', { userId: user.id, profilId: profil.id, count: responseMovies.length }, 'info');
    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_movies_route');
  }
}
