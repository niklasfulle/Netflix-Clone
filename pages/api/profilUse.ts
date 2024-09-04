import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    try {
      const { currentUser } = await serverAuth(req, res)

      await prismadb.profil.updateMany({
        data: {
          inUse: false
        }
      })

      await prismadb.profil.update({
        where: {
          id: req.body.profilId
        },
        data: {
          inUse: true
        }
      })

      return res.status(200).end()
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }


}