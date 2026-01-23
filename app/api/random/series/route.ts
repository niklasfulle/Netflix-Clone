import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
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
      db.$disconnect();
      return Response.json(null, { status: 200 });
    }

    db.$disconnect();
    const serializedMovie = serializeMovie(movie);
    return Response.json(serializedMovie, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}