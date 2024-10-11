import { db } from "@/lib/db"
import { currentUser } from "@/lib/auth"

type Params = {
  movieId: string
}

export async function GET(request: Request,
  { params }: { params: Params }) {
  try {
    const movieId = params.movieId
    if (typeof movieId !== "string") {
      throw new Error("Invalid ID")
    }

    if (!movieId) {
      throw new Error("Invalid ID")
    }

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


    const movie = await db.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      throw new Error("Invalid ID");
    }

    const movieWithWatchTime: {
      id: string;
      title: string;
      description: string;
      videoUrl: string;
      thumbnailUrl: string;
      type: string;
      genre: string;
      actor: string;
      duration: string;
      createdAt: Date;
      watchTime?: any;
    } = { ...movie, watchTime: undefined };

    const movieWatchTime = await db.movieWatchTime.findFirst({
      where: {
        userId: user.id,
        profilId: profil.id,
        movieId: movie.id
      }
    })

    if (movieWatchTime) {
      movieWithWatchTime.watchTime = movieWatchTime.time
    }

    db.$disconnect()
    return Response.json(movieWithWatchTime, { status: 200 })
  } catch (error) {
    console.log(error)
    return Response.json(null, { status: 200 })
  }
}