"use server";
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const WatchlistSchema = z.object({
  movieId: z.string(),
});

export const addToWatchlist = async (values: z.infer<typeof WatchlistSchema>) => {
  const user = await currentUser();

  if (!user) {
    logBackendAction('watchAddToWatchlist_unauthorized', {}, 'error');
    return { error: 'Unauthorized!' };
  }

  const validatedField = WatchlistSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('watchAddToWatchlist_invalid_fields', { userId: user.id, values }, 'error');
    return { error: 'Invalid fields!' };
  }

  const { movieId } = validatedField.data;

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true,
    },
  });

  if (!profil) {
    logBackendAction('watchAddToWatchlist_no_profil', { userId: user.id }, 'error');
    return { error: 'No active profile!' };
  }

  const exists = await db.watchlist.findFirst({
    where: {
      profilId: profil.id,
      movieId,
    },
  });

  if (exists) {
    await db.watchlist.update({
      where: { id: exists.id },
      data: { createdAt: new Date() },
    });
    logBackendAction('watchAddToWatchlist_update_timestamp', { userId: user.id, profilId: profil.id, movieId }, 'info');
    return { success: true, updated: true };
  }

  if(user.id && profil.id) {
    await db.watchlist.create({
      data: {
        userId: user.id,
        profilId: profil.id,
        movieId,
        createdAt: new Date(),
      },
    });
  }else {
    logBackendAction('watchAddToWatchlist_missing_ids', { userId: user?.id, profilId: profil?.id, movieId }, 'error');
  }
  
  logBackendAction('watchAddToWatchlist_success', { userId: user.id, profilId: profil.id, movieId }, 'info');
  return { success: true, created: true };
};
