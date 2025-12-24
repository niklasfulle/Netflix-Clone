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
    const series = await db.movie.findMany({
      where: { type: "Serie" },
      orderBy: { createdAt: 'desc' },
      include: { actors: { include: { actor: true } } },
    });
    // Views für alle Serien holen
    const views = await db.movieView.groupBy({
      by: ['movieId'],
      _count: { movieId: true },
    });
    const viewMap = new Map(views.map(v => [v.movieId, v._count.movieId]));
    const seriesWithViews = series.map(s => ({
      ...s,
      views: viewMap.get(s.id) || 0,
    }));
    db.$disconnect();
    return Response.json(seriesWithViews, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json(null, { status: 200 });
  }
}
