"use server"
import { logBackendAction } from '@/lib/logger';
import { without } from 'lodash';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { FavoriteIdSchema } from '@/schemas';

export const remove = async (values: z.infer<typeof FavoriteIdSchema>) => {
  const user1 = await currentUser()

  if (!user1) {
    logBackendAction('favoriteRemove_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = FavoriteIdSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('favoriteRemove_invalid_fields', { userId: user1.id, values }, 'error');
    return { error: "Invalid fields!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user1.id,
      inUse: true
    }
  })

  if (!profil) {
    logBackendAction('favoriteRemove_no_profil', { userId: user1.id }, 'error');
    return { error: "No profil found!" }
  }

  const { movieId } = validatedField.data

  const existingMovie = await db.movie.findUnique({
    where: {
      id: movieId
    }
  })

  if (!existingMovie) {
    logBackendAction('favoriteRemove_invalid_movie', { userId: user1.id, movieId }, 'error');
    return { error: "Invalid fields!" }
  }
  logBackendAction('favoriteRemove_success', { userId: user1.id, movieId }, 'info');

  const updateFavoriteIds: any = without(profil.favoriteIds, movieId)

  const updatedProfil = await db.profil.update({
    where: {
      id: profil.id,
    },
    data: {
      favoriteIds: updateFavoriteIds
    }
  })


  return { success: "Favorite removed!", data: updatedProfil.favoriteIds }
}