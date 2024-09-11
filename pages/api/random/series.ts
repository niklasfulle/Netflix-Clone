import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    await serverAuth(req, res)

    const movieCount = await prismadb.movie.count({
      where: {
        type: "Serie"
      }
    })
    const randomIndex = Math.floor(Math.random() * movieCount)

    const randomMovies = await prismadb.movie.findMany({
      where: {
        type: "Serie"
      },
      take: 1,
      skip: randomIndex
    })

    prismadb.$disconnect()
    return res.status(200).json(randomMovies[0])
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}