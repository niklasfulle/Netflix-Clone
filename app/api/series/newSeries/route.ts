import {
  getMoviesWithWatchTime,
  getUserAndProfile,
  handleApiError,
  transformMoviesResponse,
} from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const { user, profil, error } = await getUserAndProfile('api_series_newSeries');
    if (error) return error;

    const { movies, watchTime } = await getMoviesWithWatchTime(
      'Serie',
      user.id,
      profil.id,
      { take: 4, orderBy: { createdAt: 'desc' }, reverse: false },
    );

    return Response.json(transformMoviesResponse(movies, watchTime));
  } catch (error) {
    return handleApiError(error, 'api_series_newSeries');
  }
}
