import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    logBackendAction('api_actors_delete_id_required', {}, 'error');
    return Response.json({ error: 'ID required' }, { status: 400 });
  }
  // Prüfe, ob Actor noch Filme/Serien hat
  const actor = await db.actor.findUnique({
    where: { id },
    include: { movies: true }
  });
  if (!actor) {
    logBackendAction('api_actors_delete_not_found', { id }, 'error');
    return Response.json({ error: 'Actor not found' }, { status: 404 });
  }
  if (actor.movies.length > 0) {
    logBackendAction('api_actors_delete_still_linked', { id }, 'error');
    return Response.json({ error: 'Actor ist noch verknüpft.' }, { status: 400 });
  }
    logBackendAction('api_actors_delete_success', { id }, 'info');
  await db.actor.delete({ where: { id } });
  return Response.json({ success: true });
}
