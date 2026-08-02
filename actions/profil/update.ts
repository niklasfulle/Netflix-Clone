"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilSchema } from '@/schemas';

export const update = async (values: z.infer<typeof ProfilSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('profilUpdate_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('profilUpdate_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  const { profilId, profilName, profilImg } = validatedField.data

  const result = await db.profil.updateMany({
    where: {
      id: profilId,
      userId: user.id,
    },
    data: {
      name: profilName,
      image: profilImg
    }
  })

  if (result.count === 0) {
    logBackendAction('profilUpdate_not_found', { userId: user.id, profilId }, 'warn');
    return { error: "Profile not found!" }
  }

  logBackendAction('profilUpdate_success', { userId: user.id, profilId }, 'info');

  return { success: "Profil updated!" }
}
