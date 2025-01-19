"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { FavoriteIdSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";

export const add = async (values: z.infer<typeof FavoriteIdSchema>) => {
  const user = await currentUser()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  const validatedField = FavoriteIdSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user.id,
      inUse: true
    }
  })

  if (!profil) {
    return { error: "No profil found!" }
  }

  const { movieId } = validatedField.data

  const existingMovie = await db.movie.findUnique({
    where: {
      id: movieId
    }
  })

  if (!existingMovie) {
    return { error: "Invalid fields!" }
  }

  const updatedProfil = await db.profil.update({
    where: {
      id: profil.id
    },
    data: {
      favoriteIds: {
        push: movieId,
      }
    }
  })

  return { success: "Favorite created!", data: updatedProfil.favoriteIds }
}