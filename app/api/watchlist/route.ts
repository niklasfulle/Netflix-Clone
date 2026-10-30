import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { catalogThumbnailUrl } from '@/lib/catalog';

const PAGE_SIZE = 16;
export async function GET(request?: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Hole das aktive Profil
  const profil = await db.profil.findFirst({
    where: { userId: user.id, inUse: true },
  });
  if (!profil) {
    return NextResponse.json([], { status: 200 });
  }

  const rawOffset = request ? new URL(request.url).searchParams.get('offset') : null;
  const offset = rawOffset && /^\d+$/.test(rawOffset) ? Math.min(Number(rawOffset), 100000) : 0;
  const watchlist = await db.watchlist.findMany({
    where: { profilId: profil.id },
    select: { movie: { select: { id: true, title: true, type: true, genre: true, duration: true, createdAt: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: offset,
    take: PAGE_SIZE + 1,
  });

  return NextResponse.json(watchlist.slice(0, PAGE_SIZE).map(({ movie }) => ({
    id: movie.id, title: movie.title, type: movie.type, genre: movie.genre,
    duration: movie.duration, createdAt: movie.createdAt, thumbnailUrl: catalogThumbnailUrl(movie.id),
  })), { headers: { 'X-Has-More': String(watchlist.length > PAGE_SIZE), 'Cache-Control': 'private, no-store' } });
}
