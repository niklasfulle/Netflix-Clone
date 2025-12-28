"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilSchema } from '@/schemas';

export const save = async (values: z.infer<typeof ProfilSchema>) => {
  const user = await currentUser()

  if (!user) {
    logBackendAction('profilSave_unauthorized', {}, 'error');
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('profilSave_invalid_fields', { userId: user.id, values }, 'error');
    return { error: "Invalid fields!" }
  }
  logBackendAction('profilSave_success', { userId: user.id, profilName: validatedField.data.profilName }, 'info');

  const { profilName, profilImg } = validatedField.data

  await db.profil.create({
    data: {
      userId: user.id as string,
      name: profilName,
      image: profilImg
    }
  })

  return { success: "Profil created!" }
}