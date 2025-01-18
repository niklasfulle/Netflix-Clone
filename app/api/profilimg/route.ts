import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const profilImgs = await db.profilImg.findMany()
    db.$disconnect()

    return Response.json(profilImgs, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}