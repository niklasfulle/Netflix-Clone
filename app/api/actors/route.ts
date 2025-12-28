import { logBackendAction } from '@/lib/logger';
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    logBackendAction('api_actors_route_id_required', {}, 'error');
    return Response.json({ error: 'ID required' }, { status: 400 });
  }
  // Prüfe, ob Actor noch Filme/Serien hat
  const actor = await db.actor.findUnique({
    where: { id },
    include: { movies: true }
  });
  if (!actor) {
    logBackendAction('api_actors_route_not_found', { id }, 'error');
    return Response.json({ error: 'Actor not found' }, { status: 404 });
  }
  if (actor.movies.length > 0) {
    logBackendAction('api_actors_route_still_linked', { id }, 'error');
    return Response.json({ error: 'Actor ist noch verknüpft.' }, { status: 400 });
  }
    logBackendAction('api_actors_route_delete_success', { id }, 'info');
  await db.actor.delete({ where: { id } });
  return Response.json({ success: true });
}
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Pagination: ?page=1&pageSize=20
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Get total count for pagination
  const totalActors = await db.actor.count();

  // Fetch only the actors for the current page
  const actors = await db.actor.findMany({
    skip,
    take,
    orderBy: { name: 'asc' },
    include: {
      movies: {
        include: {
          movie: true
        }
      }
    }
  });

  // Für jeden Actor: Views über MovieView zählen
  const result = await Promise.all(actors.map(async actor => {
    const movieCount = actor.movies.filter(ma => ma.movie.type === 'Movie').length;
    const seriesCount = actor.movies.filter(ma => ma.movie.type === 'Serie').length;
    let views = 0;
    for (const ma of actor.movies) {
      const count = await db.movieView.count({ where: { movieId: ma.movie.id } });
      views += count;
    }
    return {
      id: actor.id,
      name: actor.name,
      movieCount,
      seriesCount,
      views
    };
  }));

  return Response.json({
    actors: result,
    total: totalActors,
    page,
    pageSize,
    totalPages: Math.ceil(totalActors / pageSize)
  }, { status: 200 });
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== 'string') {
    logBackendAction('api_actors_route_name_required', {}, 'error');
    return Response.json({ error: 'Name required' }, { status: 400 });
  }
  const exists = await db.actor.findUnique({ where: { name } });
  if (exists) {
    logBackendAction('api_actors_route_already_exists', { name }, 'error');
    return Response.json({ error: 'Actor already exists' }, { status: 400 });
  }
  const actor = await db.actor.create({ data: { name } });
  logBackendAction('api_actors_route_create_success', { name, id: actor.id }, 'info');
  return Response.json(actor, { status: 201 });
}
