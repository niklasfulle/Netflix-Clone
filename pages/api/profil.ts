import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth";
import { z } from "zod";

const profilSchema = z.object({
  profilName: z.string().min(1, 'Name must be set'),
  profilImg: z.string().min(1, 'Img must be set'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { currentUser } = await serverAuth(req, res)

      const profiles = await prismadb.profil.findMany({
        where: {
          userId: currentUser.id
        },
        orderBy: {
          createdAt: "asc"
        }
      })

      prismadb.$disconnect()
      return res.status(200).json(profiles)
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }

  if (req.method === "POST") {
    try {
      const { currentUser } = await serverAuth(req, res)
      const { profilName, profilImg } = profilSchema.parse(req.body)

      await prismadb.profil.create({
        data: {
          userId: currentUser.id,
          name: profilName,
          image: profilImg
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

  if (req.method === "PATCH") {
    try {
      const { profilName, profilImg } = profilSchema.parse(req.body)

      await prismadb.profil.update({
        where: {
          id: req.body.profilId
        },
        data: {
          name: profilName,
          image: profilImg
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

  if (req.method === "DELETE") {
    try {
      await prismadb.profil.delete({
        where: {
          id: req.body
        }
      })

      prismadb.$disconnect()
      return res.status(200).end()
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }
}