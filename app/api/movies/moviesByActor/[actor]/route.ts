import { logBackendAction } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  getMoviesByActor,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

type Params = {
  actor: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { actor } = await context.params;

    const { user, profil, error } = await getUserAndProfile('api_movies_moviesByActor');
    if (error) return error;

    const responseMovies = await getMoviesByActor(
      'Movie',
      actor,
      user.id,
      profil.id
    );

    db.$disconnect();
    logBackendAction('api_movies_moviesByActor_success', { userId: user.id, profilId: profil.id, count: responseMovies.length }, 'info');
    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_movies_moviesByActor');
  }
}