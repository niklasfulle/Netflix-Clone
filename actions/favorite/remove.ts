"use server"
import * as z from "zod";
import { db } from "@/lib/db"
import { FavoriteIdSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";
import { without } from "lodash";

export const remove = async (values: z.infer<typeof FavoriteIdSchema>) => {
  const user1 = await currentUser()

  if (!user1) {
    return { error: "Unauthorized!" }
  }

  const validatedField = FavoriteIdSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

  const profil = await db.profil.findFirst({
    where: {
      userId: user1.id,
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

  const updateFavoriteIds: any = without(profil.favoriteIds, movieId)

  const updatedProfil = await db.profil.update({
    where: {
      id: profil.id,
    },
    data: {
      favoriteIds: updateFavoriteIds
    }
  })


  return { success: "Favorite removed!", data: updatedProfil.favoriteIds }
}