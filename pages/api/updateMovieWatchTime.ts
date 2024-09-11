import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"
import serverAuth from "@/lib/serverAuth";
import { isEmpty } from "lodash";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { currentUser } = await serverAuth(req, res)

      prismadb.$connect()

      const profil = await prismadb.profil.findMany({
        where: {
          userId: currentUser.id,
          inUse: true
        }
      })

      const check = await prismadb.movieWatchTime.findMany({
        where: {
          userId: currentUser.id,
          profilId: profil[0].id,
          movieId: req.body.movieId,
        }
      })

      if (check.length == 0) {
        await prismadb.movieWatchTime.create({
          data: {
            userId: currentUser.id,
            profilId: profil[0].id,
            movieId: req.body.movieId,
            time: req.body.watchTime
          }
        })
      } else {
        await prismadb.movieWatchTime.updateMany({
          where: {
            userId: currentUser.id,
            profilId: profil[0].id,
            movieId: req.body.movieId,
          },
          data: {
            time: req.body.watchTime
          }
        })
      }

      return res.status(200).end()
    } catch (error) {
      console.log(error)
      return res.status(400).end()
    }
  }
}