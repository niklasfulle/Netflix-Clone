import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    const { currentUser } = await serverAuth(req, res)

    const profil = await prismadb.profil.findMany({
      where: {
        userId: currentUser.id,
        inUse: true
      }
    })

    const favoriteMovies = await prismadb.movie.findMany({
      where: {
        id: {
          in: profil[0]?.favoriteIds
        }
      }
    })

    return res.status(200).json(favoriteMovies)
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}