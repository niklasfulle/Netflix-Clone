import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return Response.json(null, { status: 404 })
    }

    const profiles = await db.profil.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    db.$disconnect()
    return Response.json(profiles, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 400 })
  }
}
