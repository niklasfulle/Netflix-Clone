"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { ProfilSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const update = async (values: z.infer<typeof ProfilSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const validatedField = ProfilSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

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