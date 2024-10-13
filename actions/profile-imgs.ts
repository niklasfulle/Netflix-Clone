"use server"
import { db } from "@/lib/db"

export const getProfileImgs = async () => {
  const profilImgs = await db.profilImg.findMany()

  return { profilImgs }
}