import { NextApiRequest, NextApiResponse } from "next";

import prismadb from "@/lib/prismadb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    const params = req.query
    const item = params.item as string

    const result = await prismadb.movie.findMany({
      where: {
        OR: [
          {
            title: { contains: item }
          },
          {
            description: { contains: item }
          },
          {
            actor: { contains: item }
          }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    prismadb.$disconnect()
    return res.status(200).json(result)
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}