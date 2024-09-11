import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth"

function countUnique(iterable: any) {
  return new Set(iterable).size;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    await serverAuth(req, res)

    const movies = await prismadb.movie.findMany({
      where: {
        type: "Serie"
      },
      orderBy: {
        id: "asc",
      },
    })

    let actors = new Set<string>([])
    movies.forEach((movie: any) => actors.add(movie.actor));

    let actorArray: string[] = []
    actors.forEach((actor: any) => actorArray.push(actor));

    prismadb.$disconnect()
    return res.status(200).json(actorArray.sort())
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}