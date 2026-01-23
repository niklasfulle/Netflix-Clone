import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  getActorNamesForType,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { user, profil, error } = await getUserAndProfile('api_movies_getActorsCount');
    if (error) return error;

    const actorArray = await getActorNamesForType('Movie');

    db.$disconnect();
    logBackendAction('api_movies_getActorsCount_success', { userId: user.id, profilId: profil.id, count: actorArray.length }, 'info');
    return Response.json(actorArray.length, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_movies_getActorsCount');
  }
}