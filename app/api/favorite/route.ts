import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth";


export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return Response.json(null, { status: 404 })
    }

    const profil = await db.profil.findFirst({
      where: {
        userId: user.id,
        inUse: true
      }
    })

    if (!profil) {
      return Response.json(null, { status: 404 })
    }

    db.$disconnect()
    return Response.json(profil, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
