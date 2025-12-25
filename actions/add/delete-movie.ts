"use server"

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const deleteMovie = async (movieId: string) => {
  const user = await currentUser()
  const role = await currentRole()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  if (role !== UserRole.ADMIN) {
    return { error: "Not allowed Server Action!" }
  }

  try {
    // Hole Movie-Daten bevor es gelöscht wird
    const movie = await db.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return { error: "Movie not found!" }
    }

    // Lösche Video-Datei falls vorhanden
    if (movie.videoUrl) {
      const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
      const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";
      
      const baseFolder = movie.type === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;
      
      // Versuche verschiedene Dateierweiterungen
      const extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
      
      for (const ext of extensions) {
        const filePath = path.join(baseFolder, `${movie.videoUrl}${ext}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          break;
        }
      }
    }

    // Lösche aus Datenbank
    await db.movie.delete({
      where: { id: movieId }
    });

    // Update Actor counts for all actors of this movie
    const movieActors = await db.movieActor.findMany({
      where: { movieId },
      include: { actor: true },
    });

    for (const movieActor of movieActors) {
      const actor = movieActor.actor;
      // Count remaining movies and series for this actor
      const remainingMovieCount = await db.movieActor.count({
        where: {
          actorId: actor.id,
          movie: { type: "Movie" },
        },
      });
      const remainingSerieCount = await db.movieActor.count({
        where: {
          actorId: actor.id,
          movie: { type: "Serie" },
        },
      });

      if (remainingMovieCount === 0 && remainingSerieCount === 0) {
        // Delete actor if no movies/series left
        await db.actor.delete({
          where: { id: actor.id },
        });
      }
    }

    return { success: "Movie deleted successfully!" }
  } catch (error) {
    console.error("Delete movie error:", error);
    return { error: "Failed to delete movie!" }
  }
}