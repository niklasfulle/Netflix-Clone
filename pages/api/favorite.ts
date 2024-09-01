import { NextApiRequest, NextApiResponse } from "next";
import { without } from "lodash"

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const { currentUser } = await serverAuth(req, res)

      const { movieId } = req.body

      const existingMovie = await prismadb.movie.findUnique({
        where: {
          id: movieId
        }
      })

      if (!existingMovie) {
        throw new Error("Invalid ID")
      }

      const updatedUser = await prismadb.user.update({
        where: {
          email: currentUser.email || "",
        },
        data: {
          favoriteIds: {
            push: movieId,
          }
        }
      })

      return res.status(200).json(updatedUser)
    }

    if (req.method === "DELETE") {
      const { currentUser } = await serverAuth(req, res)

      const { movieId } = req.body

      const existingMovie = await prismadb.movie.findUnique({
        where: {
          id: movieId
        }
      })

      if (!existingMovie) {
        throw new Error("Invalid ID")
      }

      const updateFavoriteIds = without(currentUser.favoriteIds, movieId)

      const updatedUser = await prismadb.user.update({
        where: {
          email: currentUser.email || "",
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