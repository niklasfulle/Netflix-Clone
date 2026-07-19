import {
  getUserAndProfile,
  getActorNamesForType,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { error } = await getUserAndProfile();
    if (error) return error;

    const actorArray = await getActorNamesForType('Serie');
    return Response.json(actorArray.length, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
