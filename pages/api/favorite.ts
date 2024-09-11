import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"
import { without } from "lodash";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const { currentUser } = await serverAuth(req, res)

      const profil = await prismadb.profil.findMany({
        where: {
          userId: currentUser.id,
          inUse: true
        }
      })

      const { movieId } = req.body

      const existingMovie = await prismadb.movie.findUnique({
        where: {
          id: movieId
        }
      })

      if (!existingMovie) {
        throw new Error("Invalid ID")
      }

      const updatedUser = await prismadb.profil.update({
        where: {
          id: profil[0].id
        },
        data: {
          favoriteIds: {
            push: movieId,
          }
        }
      })

      prismadb.$disconnect()
      return res.status(200).json(updatedUser)
    }

    if (req.method === "DELETE") {
      const { currentUser } = await serverAuth(req, res)

      const profil = await prismadb.profil.findMany({
        where: {
          userId: currentUser.id,
          inUse: true
        }
      })

      const { movieId } = req.body

      const existingMovie = await prismadb.movie.findUnique({
        where: {
          id: movieId
        }
      })

      if (!existingMovie) {
        throw new Error("Invalid ID")
      }

      const updateFavoriteIds = without(profil[0].favoriteIds, movieId)

      const updatedUser = await prismadb.profil.update({
        where: {
          id: profil[0].id,
        },
        data: {
          favoriteIds: updateFavoriteIds
        }
      })

      return res.status(200).json(updatedUser)
    }

    return res.status(405).end()
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}