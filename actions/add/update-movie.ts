"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const updateMovie = async (movieId: string, values: z.infer<typeof MovieSchema>, thumbnailUrl: string) => {
  const user = await currentUser()
  const role = await currentRole()

  if (!user) {
    return { error: "Unauthorized!" }
  }

  if (role !== UserRole.ADMIN) {
    return { error: "Not allowed Server Action!" }
  }

  const validatedField = MovieSchema.safeParse(values);

  if (!validatedField.success) {
    return { error: "Invalid fields!" }
  }

  const movie = await db.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    return { error: "Movie not found!" }
  }

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration, movieVideo } = validatedField.data

  // Wenn sich der Typ geändert hat, verschiebe die Datei
  if (movie.type !== movieType && movie.videoUrl) {
    // Hole MOVIE_FOLDER und SERIES_FOLDER aus env
    const MOVIE_FOLDER = process.env.MOVIE_FOLDER || path.resolve(process.cwd(), 'movies');
    const SERIES_FOLDER = process.env.SERIES_FOLDER || path.resolve(process.cwd(), 'series');
    const oldFolder = movie.type === 'Serie' ? SERIES_FOLDER : MOVIE_FOLDER;
    const newFolder = movieType === 'Serie' ? SERIES_FOLDER : MOVIE_FOLDER;
    let fileName = path.basename(movie.videoUrl);
    // Füge Endung hinzu, falls sie fehlt (z.B. .mp4)
    if (!path.extname(fileName)) {
      // Versuche die Endung aus dem Ordner zu ermitteln
      const possible = fs.readdirSync(oldFolder).find(f => f.startsWith(fileName + '.'));
      if (possible) fileName = possible;
    }
    let oldPath = path.join(oldFolder, fileName);
    const newPath = path.join(newFolder, fileName);
    console.log('[UPDATE-MOVIE] Move file:', { oldPath, newPath });
    try {
      if (!fs.existsSync(oldPath)) {
        // Fallback: Suche im jeweils anderen Ordner
        const altOldFolder = oldFolder === MOVIE_FOLDER ? SERIES_FOLDER : MOVIE_FOLDER;
        const altOldPath = path.join(altOldFolder, fileName);
        if (fs.existsSync(altOldPath)) {
          console.log('[UPDATE-MOVIE] Fallback: Datei im anderen Ordner gefunden:', altOldPath);
          oldPath = altOldPath;
        } else {
          console.error('[UPDATE-MOVIE] Datei nicht gefunden:', oldPath, 'und', altOldPath);
          return { error: 'Videodatei nicht gefunden!' };
        }
      }
      fs.renameSync(oldPath, newPath);
      console.log('[UPDATE-MOVIE] Datei verschoben:', oldPath, '->', newPath);
      // Passe movieVideo an, speichere ohne Extension
      const baseName = path.parse(fileName).name;
      values.movieVideo = baseName;
    } catch (err) {
      console.error('Fehler beim Verschieben der Videodatei:', err);
      return { error: 'Fehler beim Verschieben der Videodatei!' };
    }
  }

  // Update Movie-Daten (ohne actor)
  await db.movie.update({
    where: { id: movieId },
    data: {
      title: movieName,
      description: movieDescripton,
      type: movieType,
      genre: movieGenre,
      duration: movieDuration,
      videoUrl: values.movieVideo,
      thumbnailUrl: thumbnailUrl
    }
  })

  // Alle bisherigen Actor-Relationen löschen
  await db.movieActor.deleteMany({ where: { movieId } });

  // Neue Actor-Relationen anlegen
  if (Array.isArray(movieActor)) {
    for (const actorId of movieActor) {
      await db.movieActor.create({ data: { movieId, actorId } });
    }
  }

  return { success: "Movie updated!" }
}