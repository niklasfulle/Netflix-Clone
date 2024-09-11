import { NextApiRequest, NextApiResponse } from "next";
import prismadb from "@/lib/prismadb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end()
  }

  try {
    const profilImgs = await prismadb.profilImg.findMany()

    prismadb.$disconnect()
    return res.status(200).json(profilImgs)
  } catch (error) {
    console.log(error)
    return res.status(400).end()
  }
}