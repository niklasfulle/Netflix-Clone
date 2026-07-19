import { currentUser } from '@/lib/auth';
import { getRandomMovie, handleApiError } from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return Response.json(null, { status: 404 });
    }

    const movie = await getRandomMovie('Movie');

    if (!movie) {
      return Response.json(null, { status: 200 });
    }
    const safeMovie = structuredClone(movie);
    return Response.json(safeMovie, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
