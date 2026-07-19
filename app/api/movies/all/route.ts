import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isCurrentUserAdmin } from '@/lib/admin-auth';

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Pagination entfernt: Alle Movies werden zurückgegeben
    const user = await currentUser()
    if (!user) {
      logBackendAction('api_movies_all_no_user', {}, 'error');
      return Response.json(null, { status: 404 })
    }
    const profil = await db.profil.findFirst({
      where: { userId: user.id, inUse: true }
    })
    if (!profil) {
      logBackendAction('api_movies_all_no_profil', { userId: user.id }, 'error');
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
    logBackendAction('api_movies_all_success', { userId: user.id, profilId: profil.id, count: moviesWithViews.length }, 'info');
    return Response.json({
      movies: moviesWithViews,
      total: moviesWithViews.length
    }, { status: 200 });
  } catch (error) {
    logBackendAction('api_movies_all_error', { error: String(error) }, 'error');
    console.log(error);
    return Response.json(null, { status: 200 });
  }
}
