"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { WatchTimeSchema } from '@/schemas';

export const updateWatchTime = async (values: z.infer<typeof WatchTimeSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('watchUpdateWatchTime_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = WatchTimeSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('watchUpdateWatchTime_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { movieId, watchTime } = validatedField.data

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('watchUpdateWatchTime_no_profil', { userId: user.id }, 'error');
    return { error: "Invalid fields!" }
  }
  logBackendAction('watchUpdateWatchTime_success', { userId: user.id, movieId }, 'info');

  const check = await db.movieWatchTime.findMany({
    where: {
      userId: user.id,
      profilId: profil.id,
      movieId: movieId,
    }
  })

  if (check.length == 0) {
    await db.movieWatchTime.create({
      data: {
        userId: user.id as string,
        profilId: profil.id,
        movieId: movieId,
        time: watchTime
      }
    })
  } else {
    await db.movieWatchTime.updateMany({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: movieId,
      },
      data: {
        time: watchTime
      }
    })
  }


  return { success: "Watchtime updated!" }
}