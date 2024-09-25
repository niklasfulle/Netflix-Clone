import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import { z } from "zod";

const movieSchema = z.object({
  title: z.string().min(1, 'Title must be set'),
  description: z.string().min(1, 'Description must be set'),
  actor: z.string().min(1, 'Actor must be set'),
  type: z.string().min(1, 'Type must be set'),
  genre: z.string().min(1, 'Genre must be set'),
  duration: z.string().min(1, 'Duration must be set').regex(/^(\d{1,2}:)?\d{2}:\d{2}$/g, 'Invalid duration'),
  videoUrl: z.string().min(1, 'Video Url must be set'),
  thumbnailUrl: z.string().min(1, 'Thumbnail Url must be set'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { title, description, actor, type, genre, duration, videoUrl, thumbnailUrl } = movieSchema.parse(req.body)


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
        return res.status(400).json({ error: error.errors[0].message, success: false })
      }
    }
  }
}