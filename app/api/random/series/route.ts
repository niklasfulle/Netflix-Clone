import { currentUser } from '@/lib/auth';
import { getRandomMovie, serializeMovie, handleApiError } from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return Response.json(null, { status: 404 });
    }

    const movie = await getRandomMovie('Serie');

    if (!movie) {
      return Response.json(null, { status: 200 });
    }
    const serializedMovie = serializeMovie(movie);
    return Response.json(serializedMovie, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
