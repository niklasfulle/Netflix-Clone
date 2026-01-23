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
    const { user, profil, error } = await getUserAndProfile();
    if (error) return error;

    const { movies, watchTime } = await getMoviesWithWatchTime(
      'Serie',
      user.id,
      profil.id
    );

    const responseMovies = transformMoviesResponse(movies, watchTime);

    db.$disconnect();
    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
