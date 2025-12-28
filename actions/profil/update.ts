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
  logBackendAction('profilUpdate_success', { userId: user.id, profilId: validatedField.data.profilId }, 'info');

  const { profilId, profilName, profilImg } = validatedField.data

  await db.profil.update({
    where: {
      id: profilId
    },
    data: {
      name: profilName,
      image: profilImg
    }
  })

  return { success: "Profil updated!" }
}