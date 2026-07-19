import { db } from '@/lib/db';
import { getUserAndProfile } from '@/lib/api-helpers';
import {
  CONTINUE_WATCHING_MAX_ITEMS,
  getRecentContinueWatchingIds,
} from '@/lib/watch-progress';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, profil, error } = await getUserAndProfile(
      'api_continue_watching'
    );
    if (error) return error;

    const watchTimes = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
        time: { gt: 0 },
      },
    });

    if (watchTimes.length === 0) {
      return Response.json([], { status: 200 });
    }

    const movies = await db.movie.findMany({
      where: {
        id: { in: watchTimes.map((entry) => entry.movieId) },
      },
      include: {
        actors: {
          include: { actor: true },
        },
      },
    });

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
    const watchTimesByMovieId = new Map(
      watchTimes.map((entry) => [entry.movieId, entry.time])
    );
    const durationsByMovieId = new Map(
      movies.map((movie) => [movie.id, movie.duration])
    );

    const recentViews = await db.movieView.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: { in: watchTimes.map((entry) => entry.movieId) },
      },
      orderBy: { createdAt: 'desc' },
      select: { movieId: true, createdAt: true },
    });

    const recentMovieIds = getRecentContinueWatchingIds(
      recentViews,
      watchTimesByMovieId,
      durationsByMovieId,
      CONTINUE_WATCHING_MAX_ITEMS
    );

    const continueWatching = recentMovieIds
      .map((movieId) => {
        const movie = moviesById.get(movieId);
        const watchTime = watchTimesByMovieId.get(movieId);
        if (!movie || watchTime === undefined) return null;

        return {
          ...movie,
          actors: movie.actors.map(({ actor }) => actor),
          actor: movie.actors.map(({ actor }) => actor.name).join(', '),
          watchTime,
        };
      })
      .filter((movie) => movie !== null)
      .slice(0, CONTINUE_WATCHING_MAX_ITEMS);

    return Response.json(continueWatching, { status: 200 });
  } catch (error) {
    console.error('Continue watching error:', error);
    return Response.json([], { status: 200 });
  }
}
