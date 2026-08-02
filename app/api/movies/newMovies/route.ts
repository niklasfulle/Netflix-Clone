import { logBackendAction } from '@/lib/logger';
import {
  getMoviesWithWatchTime,
  getUserAndProfile,
  handleApiError,
  transformMoviesResponse,
} from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const { user, profil, error } = await getUserAndProfile('api_movies_newMovies');
    if (error) return error;

    const { movies, watchTime } = await getMoviesWithWatchTime(
      'Movie',
      user.id,
      profil.id,
      { take: 4, orderBy: { createdAt: 'desc' }, reverse: false },
    );
    const responseMovies = transformMoviesResponse(movies, watchTime);

    logBackendAction('api_movies_newMovies_success', {
      userId: user.id,
      profilId: profil.id,
      count: responseMovies.length,
    }, 'info');
    return Response.json(responseMovies);
  } catch (error) {
    return handleApiError(error, 'api_movies_newMovies');
  }
}
