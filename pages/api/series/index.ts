import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    await serverAuth(req, res)

    let movies = await prismadb.movie.findMany({
      where: {
        type: "Serie"
      }
    })

    movies.reverse()

    const { currentUser } = await serverAuth(req, res)

    prismadb.$connect()

    const profil = await prismadb.profil.findMany({
      where: {
        userId: currentUser.id,
        inUse: true
      }
    })

    const watchTime = await prismadb.movieWatchTime.findMany({
      where: {
        userId: currentUser.id,
        profilId: profil[0].id,
        movieId: req.body.movieId,
      }
    })

    for (let i = 0; i < movies.length; i++) {
      for (let j = 0; j < watchTime.length; j++) {
        let movieWithWatchTime: {
          id: string;
          title: string;
          description: string;
          videoUrl: string;
          thumbnailUrl: string;
          type: string;
          genre: string;
          actor: string;
          duration: string;
          createdAt: Date;
          watchTime?: any;
        } = { ...movies[i], watchTime: undefined };

        if (movies[i].id == watchTime[j].movieId) {
          movieWithWatchTime.watchTime = watchTime[j].time
          movies[i] = movieWithWatchTime
        }
      }
    }

    prismadb.$disconnect()
    return res.status(200).json(movies)
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}