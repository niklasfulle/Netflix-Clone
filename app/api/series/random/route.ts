import { logBackendAction } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  getUserAndProfile,
  handleApiError,
} from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { user, profil, error } = await getUserAndProfile('api_series_random_route');
    if (error) return error;

    const searchParams = req.nextUrl.searchParams;
    const countParam = searchParams.get('count');
    const count = Math.min(Number.parseInt(countParam || '20', 10), 20);

    // Hole alle Serie IDs
    const allSeries = await db.movie.findMany({
      where: { type: 'Serie' },
      select: { id: true }
    });
    
    if (allSeries.length === 0) {
      logBackendAction('api_series_random_route_no_series', { userId: user.id }, 'info');
      db.$disconnect();
      return Response.json([], { status: 200 });
    }

    // Fisher-Yates Shuffle für bessere Randomisierung
    const shuffled = [...allSeries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selectedIds = shuffled.slice(0, Math.min(count, allSeries.length)).map(s => s.id);

    // Hole die vollständigen Serie-Daten
    const randomSeries = await db.movie.findMany({
      where: {
        id: { in: selectedIds },
        type: 'Serie'
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        type: true,
        genre: true,
        duration: true,
        createdAt: true,
      },
    });

    // Serialisiere Date-Objekte
    const serializedSeries = randomSeries.map(serie => ({
      ...serie,
      createdAt: serie.createdAt?.toISOString?.() ?? serie.createdAt,
    }));

    db.$disconnect();
    logBackendAction('api_series_random_route_success', { 
      userId: user.id, 
      profilId: profil.id, 
      count: serializedSeries.length 
    }, 'info');
    
    return Response.json(serializedSeries, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'api_series_random_route');
  }
}
