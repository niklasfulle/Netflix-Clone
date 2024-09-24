import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import { z } from "zod";

const movieSchema = z.object({
  title: z.string(),
  description: z.string(),
  videoUrl: z.string(),
  thumbnailUrl: z.string(),
  type: z.string(),
  genre: z.string(),
  actor: z.string(),
  duration: z.string().regex(/^(\d{1,2}:)?\d{2}:\d{2}$/g, 'Invalid duration'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { title, description, videoUrl, thumbnailUrl, type, genre, actor, duration } = movieSchema.parse(req.body)


      await prismadb.movie.create({
        data: {
          title: title,
          description: description,
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          type: type,
          genre: genre,
          actor: actor,
          duration: duration
        }
      })

      prismadb.$disconnect()
      return res.status(200).end()
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(error)
        return res.status(400).json({ error: error.errors[0].message, success: false })
      }
    }
  }
}