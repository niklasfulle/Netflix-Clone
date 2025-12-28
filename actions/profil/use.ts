"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilIdSchema } from '@/schemas';

export const use = async (values: z.infer<typeof ProfilIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('profilUse_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilIdSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('profilUse_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  logBackendAction('profilUse_success', { userId: user.id, profilId: validatedField.data.profilId }, 'info');

  const { profilId } = validatedField.data

  await db.profil.updateMany({
    where: {
      userId: user.id
    },
    data: {
      inUse: false
    }
  })

  await db.profil.update({
    where: {
      userId: user.id,
      id: profilId
    },
    data: {
      inUse: true
    }
  })

  return { success: "Profil use!" }
}