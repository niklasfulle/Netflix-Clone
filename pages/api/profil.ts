import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth";

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

      return res.status(200).json(profiles)
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }

  if (req.method === "POST") {
    try {
      const { currentUser } = await serverAuth(req, res)

      await prismadb.profil.create({
        data: {
          userId: currentUser.id,
          name: req.body.profilName,
          image: req.body.profilImg
        }
      })

      return res.status(200).end()
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }
}