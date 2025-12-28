"use server";
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const MovieViewSchema = z.object({
  movieId: z.string(),
});

export const addMovieView = async (values: z.infer<typeof MovieViewSchema>) => {
  const user = await currentUser();

  if (!user) {
    logBackendAction('watchAddMovieView_unauthorized', {}, 'error');
    return { error: 'Unauthorized!' };
  }

  const validatedField = MovieViewSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('watchAddMovieView_invalid_fields', { userId: user.id, values }, 'error');
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
    logBackendAction('watchAddMovieView_no_profil', { userId: user.id }, 'error');
    return { error: 'Invalid fields!' };
  }
  logBackendAction('watchAddMovieView_success', { userId: user.id, movieId }, 'info');


  // Prüfe, ob heute schon ein View existiert
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existingView = await db.movieView.findFirst({
    where: {
      userId: user.id!,
      profilId: profil.id!,
      movieId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (!existingView) {
    await db.movieView.create({
      data: {
        userId: user.id!,
        profilId: profil.id!,
        movieId,
      },
    });
  }

  return { success: true };
};
