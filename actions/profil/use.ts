"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { ProfilIdSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const use = async (values: z.infer<typeof ProfilIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilIdSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

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

  return { success: "Profil updated!" }
}