"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { FavoriteIdSchema } from '@/schemas';

export const add = async (values: z.infer<typeof FavoriteIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('favoriteAdd_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = FavoriteIdSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('favoriteAdd_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('favoriteAdd_no_profil', { userId: user.id }, 'error');
    return { error: "No profil found!" }
  }

  const { movieId } = validatedField.data

  const existingMovie = await db.movie.findUnique({
    where: {
      id: movieId
    }
  })

  if (!existingMovie) {
    logBackendAction('favoriteAdd_invalid_movie', { userId: user.id, movieId }, 'error');
    return { error: "Invalid fields!" }
  }
  logBackendAction('favoriteAdd_success', { userId: user.id, movieId }, 'info');

  const updatedProfil = await db.profil.update({
    where: {
      id: profil.id
    },
    data: {
      favoriteIds: {
        push: movieId,
      }
    }
  })

  return { success: "Favorite created!", data: updatedProfil.favoriteIds }
}