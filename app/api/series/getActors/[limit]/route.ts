import { NextRequest } from 'next/server';
import {
  getUserAndProfile,
  getActorsWithPagination,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

type Params = {
  limit: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { limit } = await context.params;
    const param = limit.split("_");
    const start = Number(param[0]);
    const limitNum = Number(param[1]);

    const { error } = await getUserAndProfile();
    if (error) return error;

    const actorArray = await getActorsWithPagination('Serie', start, limitNum);
    return Response.json(actorArray, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
