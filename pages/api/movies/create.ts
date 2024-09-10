import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {

      await prismadb.movie.create({
        data: {
          title: req.body.name,
          description: req.body.description,
          videoUrl: req.body.video,
          thumbnailUrl: req.body.thumbnail,
          type: req.body.type,
          genre: req.body.genre,
          actor: req.body.actor,
          duration: req.body.duration
        }
      })

      return res.status(200).end()
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }
}