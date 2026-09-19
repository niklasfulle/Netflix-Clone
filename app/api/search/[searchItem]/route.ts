import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  transformMoviesResponse,
  handleApiError,
} from '@/lib/api-helpers';
import {
  createEmptySearchResults,
  getSearchContentTypes,
  MIN_SEARCH_LENGTH,
  SEARCH_RESULT_LIMIT,
} from '@/lib/search';

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{
    searchItem: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { searchItem } = await params;
    const searchQuery = decodeURIComponent(searchItem).trim();
    const contentTypes = getSearchContentTypes();

    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      return Response.json(createEmptySearchResults(contentTypes), { status: 200 });
    }

    const { user, profil, error } = await getUserAndProfile('api_search_route');
    if (error) return error;

    const [{ actors }, movies] = await Promise.all([
      db.actor.findMany({
        where: {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
          movies: {
            some: {
              movie: {
                type: { in: contentTypes },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
        take: SEARCH_RESULT_LIMIT,
      }).then((items) => ({ actors: items })),
      db.movie.findMany({
        where: {
          type: { in: contentTypes },
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
            {
              actors: {
                some: {
                  actor: {
                    name: {
                      contains: searchQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          actors: {
            include: {
              actor: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: SEARCH_RESULT_LIMIT * contentTypes.length,
      }),
    ]);

    // Get watch time for the user's profile
    const watchTime = movies.length === 0
      ? []
      : await db.movieWatchTime.findMany({
          where: {
            userId: user.id,
            profilId: profil.id,
            movieId: { in: movies.map((movie) => movie.id) },
          },
        });

    const responseMovies = transformMoviesResponse(movies, watchTime);
    const content = Object.fromEntries(
      contentTypes.map((type) => [
        type,
        responseMovies.filter((movie) => movie.type === type),
      ])
    );
    logBackendAction(
      'api_search_route_success',
      {
        userId: user.id,
        profilId: profil.id,
        searchQuery,
        actorCount: actors.length,
        contentCount: responseMovies.length,
      },
      'info'
    );

    return Response.json({ actors, content }, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_search_route');
  }
}
