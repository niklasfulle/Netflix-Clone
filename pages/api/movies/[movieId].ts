import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    await serverAuth(req, res)

    const { movieId } = req.query

    if (typeof movieId !== "string") {
      throw new Error("Invalid ID")
    }

    if (!movieId) {
      throw new Error("Invalid ID")
    }

    const { currentUser } = await serverAuth(req, res)

    const profil = await prismadb.profil.findMany({
      where: {
        userId: currentUser.id,
        inUse: true
      }
    })

    if (profil.length === 0) {
      throw new Error("No profil found")
    }

    const firstProfil = profil[0];

    const movie = await prismadb.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      throw new Error("Invalid ID");
    }

    const movieWithWatchTime: {
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
    } = { ...movie, watchTime: undefined };

    const movieWatchTime = await prismadb.movieWatchTime.findMany({
      where: {
        userId: currentUser.id,
        profilId: firstProfil.id,
        movieId: movie.id
      }
    })

    if (movieWatchTime.length !== 0) {
      movieWithWatchTime.watchTime = movieWatchTime[0].time
    }

    prismadb.$disconnect()
    return res.status(200).json(movieWithWatchTime)
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}