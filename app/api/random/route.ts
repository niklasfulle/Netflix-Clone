import { currentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return Response.json(null, { status: 404 })
    }

    const movieCount = await db.movie.count()
    const randomIndex = Math.floor(Math.random() * movieCount)

    const randomMovies = await db.movie.findMany({
      take: 1,
      skip: randomIndex
    })

    db.$disconnect()
    return Response.json(randomMovies[0], { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}