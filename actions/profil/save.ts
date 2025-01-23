"use server"
import * as z from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfilSchema } from '@/schemas';

export const save = async (values: z.infer<typeof ProfilSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

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