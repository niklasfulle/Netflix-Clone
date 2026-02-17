import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  transformMoviesResponse,
  handleApiError,
} from '@/lib/api-helpers';

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{
    searchItem: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { user, profil, error } = await getUserAndProfile('api_search_route');
    if (error) return error;

    const { searchItem } = await params;
    const searchQuery = decodeURIComponent(searchItem);

    // Search for movies and series matching the search query
    const movies = await db.movie.findMany({
      where: {
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
    });

    // Get watch time for the user's profile
    const watchTime = await db.movieWatchTime.findMany({
      where: {
        userId: user.id,
        profilId: profil.id,
      },
    });

    const responseMovies = transformMoviesResponse(movies, watchTime);

    db.$disconnect();
    logBackendAction(
      'api_search_route_success',
      {
        userId: user.id,
        profilId: profil.id,
        searchQuery,
        count: responseMovies.length,
      },
      'info'
    );

    return Response.json(responseMovies, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_search_route');
  }
}
