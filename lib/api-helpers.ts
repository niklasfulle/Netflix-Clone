import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';
import { getRedisRuntime, type RedisKey, type RedisRuntime } from '@/lib/redis/runtime';
import { Movie, MovieWatchTime, Prisma, Profil } from '@prisma/client';
import {
  CATALOG_ACTOR_ROW_LIMIT,
  catalogThumbnailUrl,
  type CatalogCardDto,
} from '@/lib/catalog';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiErrorResponse(code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } }, { status: API_ERROR_STATUS[code] });
}

type TransformableMovie = Pick<Movie, 'id' | 'title'> &
  Partial<Omit<Movie, 'id' | 'title' | 'createdAt'>> & {
    createdAt?: Date | string;
    actors: Array<{ actor: { name: string } }>;
  };
type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof currentUser>>> & { id: string };

const CATALOG_CACHE_TTL_SECONDS = 300;

type CatalogCache = {
  runtime: RedisRuntime;
  key: RedisKey;
  writable: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeCatalogMovies(value: unknown): TransformableMovie[] {
  if (!Array.isArray(value)) throw new Error('Cached catalog must be an array');

  for (const movie of value) {
    if (
      !isRecord(movie)
      || typeof movie.id !== 'string'
      || typeof movie.title !== 'string'
      || (movie.createdAt !== undefined && typeof movie.createdAt !== 'string')
      || !Array.isArray(movie.actors)
      || movie.actors.some(movieActor => (
        !isRecord(movieActor)
        || !isRecord(movieActor.actor)
        || typeof movieActor.actor.name !== 'string'
      ))
    ) {
      throw new Error('Cached catalog contains invalid movie metadata');
    }
  }

  return value as TransformableMovie[];
}

function catalogCacheIdentity(
  type: 'Movie' | 'Serie',
  options: {
    take: number;
    orderBy: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
    where: Prisma.MovieWhereInput;
    reverse: boolean;
  },
): string {
  return JSON.stringify({ type, ...options });
}

async function readCatalogCache(identity: string): Promise<
  { movies: TransformableMovie[] | null; cache?: CatalogCache }
> {
  try {
    const runtime = getRedisRuntime();
    const key = runtime.key('catalog-metadata', 1, [identity]);
    const result = await runtime.get(key, decodeCatalogMovies);
    if (result.status === 'ok') {
      return {
        movies: result.value,
        cache: { runtime, key, writable: result.value === null },
      };
    }
    return {
      movies: null,
      cache: {
        runtime,
        key,
        writable: result.status === 'error' && result.reason === 'invalid-data',
      },
    };
  } catch {
    return { movies: null };
  }
}

async function writeCatalogCache(
  cache: CatalogCache | undefined,
  movies: TransformableMovie[],
): Promise<void> {
  if (!cache?.writable) return;
  try {
    await cache.runtime.set(cache.key, movies, { ttlSeconds: CATALOG_CACHE_TTL_SECONDS });
  } catch {
    // PostgreSQL remains the source of truth when Redis is unavailable.
  }
}

export const CATALOG_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  genre: true,
  duration: true,
  createdAt: true,
  actors: {
    select: {
      actor: {
        select: { name: true },
      },
    },
  },
} satisfies Prisma.MovieSelect;

/**
 * Get current authenticated user and their active profile
 * @returns Object with user and profile, or error response
 */
export async function getUserAndProfile(logContext?: string): Promise<
  | { user: AuthenticatedUser; profil: Profil; error?: never }
  | { user?: never; profil?: never; error: Response }
> {
  const user = await currentUser();

  if (!user?.id) {
    if (logContext) {
      logBackendAction(`${logContext}_no_user`, {}, 'error');
    }
    return { error: apiErrorResponse('UNAUTHENTICATED', 'Authentication required.') };
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
    return { error: apiErrorResponse('NOT_FOUND', 'Active profile not found.') };
  }

  return { user: user as AuthenticatedUser, profil };
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
    orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
    where?: Prisma.MovieWhereInput;
    reverse?: boolean;
  } = {}
) {
  const { take = 20, orderBy = { createdAt: 'asc' }, where = {}, reverse = true } = options;

  const cacheIdentity = catalogCacheIdentity(type, { take, orderBy, where, reverse });
  const cached = await readCatalogCache(cacheIdentity);
  let movies = cached.movies;

  if (movies === null) {
    movies = await db.movie.findMany({
      where: {
        type,
        ...where,
      },
      take,
      orderBy,
      select: CATALOG_CARD_SELECT,
    });

    if (reverse) {
      movies.reverse();
    }
    await writeCatalogCache(cached.cache, movies);
  }

  const watchTime = await db.movieWatchTime.findMany({
    where: {
      userId,
      profilId,
      movieId: { in: movies.map((movie) => movie.id) },
    },
  });

  return { movies, watchTime };
}

/**
 * Transform movies array to response format with actor names and watch time
 */
export function transformMoviesResponse(
  movies: TransformableMovie[],
  watchTime: Pick<MovieWatchTime, 'movieId' | 'time'>[]
): CatalogCardDto[] {
  return movies.map((movie) => {
    const actorNames = movie.actors.map((movieActor) => movieActor.actor.name).join(', ');
    const timeObj = watchTime.find((t) => t.movieId === movie.id);
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      thumbnailUrl: catalogThumbnailUrl(movie.id),
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
      take: CATALOG_ACTOR_ROW_LIMIT,
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
    movie.actors.forEach((movieActor) => {
      if (movieActor.actor?.name) {
        actors.add(movieActor.actor.name);
      }
    });
  });

  return Array.from(actors);
}

/**
 * Get random movie or series
 */
export async function getRandomMovie(type: 'Movie' | 'Serie') {
  const where = {
    type,
    status: 'PUBLISHED' as const,
    videoUrl: { not: '' },
    thumbnailUrl: { not: '' },
  };

  const movieCount = await db.movie.count({
    where,
  });

  if (movieCount === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * movieCount);

  const randomMovies = await db.movie.findMany({
    where,
    take: 1,
    skip: randomIndex,
  });

  return randomMovies[0] || null;
}

/**
 * Handle API errors with logging and response
 */
export function handleApiError(error: unknown, logContext?: string) {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError('INTERNAL_ERROR', 'An unexpected error occurred.');
  if (logContext) {
    logBackendAction(`${logContext}_error`, {
      errorName: error instanceof Error ? error.name : typeof error,
      code: apiError.code,
    }, 'error');
  }
  return apiErrorResponse(apiError.code, apiError.message);
}

/**
 * Serialize movie object for JSON response
 */
export function serializeMovie<T extends { createdAt?: Date | string | null }>(movie: T) {
  return {
    ...movie,
    createdAt: movie.createdAt instanceof Date
      ? movie.createdAt.toISOString()
      : movie.createdAt,
  };
}
