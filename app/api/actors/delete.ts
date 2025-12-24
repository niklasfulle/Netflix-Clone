import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 });
  }
  // Prüfe, ob Actor noch Filme/Serien hat
  const actor = await db.actor.findUnique({
    where: { id },
    include: { movies: true }
  });
  if (!actor) {
    return Response.json({ error: 'Actor not found' }, { status: 404 });
  }
  if (actor.movies.length > 0) {
    return Response.json({ error: 'Actor ist noch verknüpft.' }, { status: 400 });
  }
  await db.actor.delete({ where: { id } });
  return Response.json({ success: true });
}
