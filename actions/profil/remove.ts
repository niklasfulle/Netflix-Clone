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
  logBackendAction('profilRemove_success', { userId: user.id, profilId: validatedField.data.profilId }, 'info');

  const { profilId } = validatedField.data

  await db.profil.delete({
    where: {
      id: profilId
    }
  })

  return { success: "Profil removed!" }
}