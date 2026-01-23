import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
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

  // Hole die Watchlist-Einträge für das Profil
  const watchlist = await db.watchlist.findMany({
    where: { profilId: profil.id },
    include: { movie: true },
    orderBy: { createdAt: 'desc' },
  });

  // Gib nur die Movie-Daten zurück
  return NextResponse.json(watchlist.map(entry => entry.movie));
}
