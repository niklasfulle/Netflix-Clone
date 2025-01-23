"use server"
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilIdSchema } from '@/schemas';

export const remove = async (values: z.infer<typeof ProfilIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilIdSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

  const { profilId } = validatedField.data

  await db.profil.delete({
    where: {
      id: profilId
    }
  })

  return { success: "Profil removed!" }
}