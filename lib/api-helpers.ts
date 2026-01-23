import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';

/**
 * Get current authenticated user and their active profile
 * @returns Object with user and profile, or error response
 */
export async function getUserAndProfile(logContext?: string): Promise<
  | { user: any; profil: any; error?: never }
  | { user?: never; profil?: never; error: Response }
> {
  const user = await currentUser();

  if (!user) {
    if (logContext) {
      logBackendAction(`${logContext}_no_user`, {}, 'error');
    }
    return { error: Response.json(null, { status: 404 }) };
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true,
    },
  });

  if (!profil) {
    if (logContext) {
      logBackendAction(`${logContext}_no_profil`, { userId: user.id }, 'error');
    }
    return { error: Response.json(null, { status: 404 }) };
  }

  return { user, profil };
}

/**
 * Get movies/series with watch time for a user and profile
 * @param type - "Movie" or "Serie"
 * @param userId - User ID
 * @param profilId - Profile ID
 * @param options - Additional query options
 */
export async function getMoviesWithWatchTime(
  type: 'Movie' | 'Serie',
  userId: string,
  profilId: string,
  options: {
    take?: number;
    orderBy?: any;
    where?: any;
    reverse?: boolean;
  } = {}
) {
  const { take = 20, orderBy = { createdAt: 'asc' }, where = {}, reverse = true } = options;

  const movies = await db.movie.findMany({
    where: {
      type,
      ...where,
    },
    take,
    orderBy,
    include: {
      actors: {
        include: {
          actor: true,
        },
      },
    },
  });

  if (reverse) {
    movies.reverse();
  }

  const watchTime = await db.movieWatchTime.findMany({
    where: {
      userId,
      profilId,
    },
  });

  return { movies, watchTime };
}

/**
 * Transform movies array to response format with actor names and watch time
 */
export function transformMoviesResponse(
  movies: any[],
  watchTime: any[]
) {
  return movies.map((movie) => {
    const actorNames = movie.actors.map((ma: any) => ma.actor.name).join(', ');
    const timeObj = watchTime.find((t) => t.movieId === movie.id);
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      videoUrl: movie.videoUrl,
      thumbnailUrl: movie.thumbnailUrl,
      type: movie.type,
      genre: movie.genre,
      actor: actorNames,
      duration: movie.duration,
      createdAt: movie.createdAt,
      watchTime: timeObj ? timeObj.time : undefined,
    };
  });
}

/**
 * Get movies/series by actor name
 */
export async function getMoviesByActor(
  type: 'Movie' | 'Serie',
  actorName: string,
  userId: string,
  profilId: string
) {
  const { movies, watchTime } = await getMoviesWithWatchTime(
    type,
    userId,
    profilId,
    {
      where: {
        actors: {
          some: {
            actor: {
              name: actorName,
            },
          },
        },
      },
    }
  );

  return transformMoviesResponse(movies, watchTime);
}

/**
 * Get actors for movies or series with pagination
 */
export async function getActorsWithPagination(
  type: 'Movie' | 'Serie' | 'Series',
  start: number,
  limit: number
) {
  const whereCondition = type === 'Movie'
    ? { type: 'Movie' }
    : {
        OR: [
          { type: 'Serie' },
          { type: 'Series' },
        ],
      };

  const actors = await db.actor.findMany({
    where: {
      movies: {
        some: {
          movie: whereCondition,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
    skip: start,
    take: limit,
  });

  return actors.map((actor) => actor.name);
}

/**
 * Get unique actor count for movie type
 */
export async function getActorNamesForType(type: 'Movie' | 'Serie') {
  const movies = await db.movie.findMany({
    where: {
      type,
    },
    orderBy: {
      id: 'asc',
    },
    include: {
      actors: {
        include: {
          actor: true,
        },
      },
    },
  });

  const actors = new Set<string>();
  movies.forEach((movie) => {
    movie.actors.forEach((ma: any) => {
      if (ma.actor?.name) {
        actors.add(ma.actor.name);
      }
    });
  });

  return Array.from(actors);
}

/**
 * Get random movie or series
 */
export async function getRandomMovie(type: 'Movie' | 'Serie') {
  const movieCount = await db.movie.count({
    where: {
      type,
    },
  });

  if (movieCount === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * movieCount);

  const randomMovies = await db.movie.findMany({
    where: {
      type,
    },
    take: 1,
    skip: randomIndex,
  });

  return randomMovies[0] || null;
}

/**
 * Handle API errors with logging and response
 */
export function handleApiError(error: unknown, logContext?: string) {
  if (logContext) {
    logBackendAction(`${logContext}_error`, { error: String(error) }, 'error');
  }
  console.log(error);
  return Response.json(null, { status: 200 });
}

/**
 * Serialize movie object for JSON response
 */
export function serializeMovie(movie: any) {
  return {
    ...movie,
    createdAt: movie.createdAt?.toISOString?.() ?? movie.createdAt,
  };
}
