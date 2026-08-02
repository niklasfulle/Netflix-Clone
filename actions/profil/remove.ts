"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilIdSchema } from '@/schemas';

export const remove = async (values: z.infer<typeof ProfilIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('profilRemove_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilIdSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('profilRemove_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  const { profilId } = validatedField.data

  const result = await db.profil.deleteMany({
    where: {
      id: profilId,
      userId: user.id,
    }
  })

  if (result.count === 0) {
    logBackendAction('profilRemove_not_found', { userId: user.id, profilId }, 'warn');
    return { error: "Profile not found!" }
  }

  logBackendAction('profilRemove_success', { userId: user.id, profilId }, 'info');

  return { success: "Profil removed!" }
}
