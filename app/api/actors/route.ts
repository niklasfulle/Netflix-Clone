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
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  // Liefert alle Actors mit Film- und Serien-Anzahl
        const actors = await db.actor.findMany({
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

  return Response.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== 'string') {
    return Response.json({ error: 'Name required' }, { status: 400 });
  }
  const exists = await db.actor.findUnique({ where: { name } });
  if (exists) {
    return Response.json({ error: 'Actor already exists' }, { status: 400 });
  }
  const actor = await db.actor.create({ data: { name } });
  return Response.json(actor, { status: 201 });
}
