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

    const { user, profil, error } = await getUserAndProfile();
    if (error) return error;

    const responseSeries = await getMoviesByActor(
      'Serie',
      actor,
      user.id,
      profil.id
    );

    db.$disconnect();
    return Response.json(responseSeries, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}