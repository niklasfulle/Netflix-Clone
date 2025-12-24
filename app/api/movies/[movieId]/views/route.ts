import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
export const dynamic = "force-dynamic";

type Params = {
  movieId: string
}

export async function GET(request: NextRequest, context: { params: Promise<Params> }): Promise<Response> {
  try {
    const { movieId } = await context.params
    if (!movieId) return Response.json({ count: 0 }, { status: 404 });
    const count = await db.movieView.count({ where: { movieId } });
    return Response.json({ count }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ count: 0 }, { status: 500 });
  }
}
