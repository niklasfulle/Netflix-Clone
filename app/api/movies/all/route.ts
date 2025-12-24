import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return Response.json(null, { status: 404 })
    }
    const profil = await db.profil.findFirst({
      where: { userId: user.id, inUse: true }
    })
    if (!profil) {
      return Response.json(null, { status: 404 })
    }
    const movies = await db.movie.findMany({
      where: { type: "Movie" },
      orderBy: { createdAt: 'desc' },
      include: { actors: { include: { actor: true } } },
    });
    // Views für alle Movies holen
    const views = await db.movieView.groupBy({
      by: ['movieId'],
      _count: { movieId: true },
    });
    const viewMap = new Map(views.map(v => [v.movieId, v._count.movieId]));
    const moviesWithViews = movies.map(m => ({
      ...m,
      views: viewMap.get(m.id) || 0,
    }));
    db.$disconnect();
    return Response.json(moviesWithViews, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json(null, { status: 200 });
  }
}
