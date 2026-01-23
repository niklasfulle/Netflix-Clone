"use server"
import * as z from 'zod';

import { currentRole, currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MovieSchema } from '@/schemas';
import { UserRole } from '@prisma/client';
import { logBackendAction } from '@/lib/logger';
import fs from 'node:fs';
import path from 'node:path';

const getFolders = () => {
  const MOVIE_FOLDER = process.env.MOVIE_FOLDER || path.resolve(process.cwd(), 'movies');
  const SERIES_FOLDER = process.env.SERIES_FOLDER || path.resolve(process.cwd(), 'series');
  return { MOVIE_FOLDER, SERIES_FOLDER };
};

const getFolder = (type: string, folders: { MOVIE_FOLDER: string; SERIES_FOLDER: string }) => {
  return type === 'Serie' ? folders.SERIES_FOLDER : folders.MOVIE_FOLDER;
};

const resolveFileName = (fileName: string, folder: string): string => {
  if (path.extname(fileName)) {
    return fileName;
  }
  const possible = fs.readdirSync(folder).find(f => f.startsWith(fileName + '.'));
  return possible || fileName;
};

const findVideoFile = (fileName: string, oldFolder: string, altFolder: string): string | null => {
  const oldPath = path.join(oldFolder, fileName);
  if (fs.existsSync(oldPath)) {
    return oldPath;
  }
  
  const altPath = path.join(altFolder, fileName);
  if (fs.existsSync(altPath)) {
    console.log('[UPDATE-MOVIE] Fallback: Datei im anderen Ordner gefunden:', altPath);
    return altPath;
  }
  
  console.error('[UPDATE-MOVIE] Datei nicht gefunden:', oldPath, 'und', altPath);
  return null;
};

const moveFileCrossDevice = async (oldPath: string, newPath: string): Promise<void> => {
  const readStream = fs.createReadStream(oldPath);
  const writeStream = fs.createWriteStream(newPath);
  await new Promise((resolve, reject) => {
    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('close', resolve);
    readStream.pipe(writeStream);
  });
  fs.unlinkSync(oldPath);
  console.log('[UPDATE-MOVIE] Datei kopiert und Original gelöscht (cross-device):', oldPath, '->', newPath);
};

const moveVideoFile = async (oldPath: string, newPath: string): Promise<void> => {
  try {
    fs.renameSync(oldPath, newPath);
  } catch (err: any) {
    if (err.code === 'EXDEV') {
      await moveFileCrossDevice(oldPath, newPath);
    } else {
      throw err;
    }
  }
};

const handleVideoTypeChange = async (
  movie: any,
  movieType: string,
  values: z.infer<typeof MovieSchema>
): Promise<{ error?: string }> => {
  if (movie.type === movieType || !movie.videoUrl) {
    return {};
  }

  const folders = getFolders();
  const oldFolder = getFolder(movie.type, folders);
  const newFolder = getFolder(movieType, folders);
  const altFolder = oldFolder === folders.MOVIE_FOLDER ? folders.SERIES_FOLDER : folders.MOVIE_FOLDER;
  
  let fileName = path.basename(movie.videoUrl);
  fileName = resolveFileName(fileName, oldFolder);
  
  const oldPath = findVideoFile(fileName, oldFolder, altFolder);
  if (!oldPath) {
    return { error: 'Videodatei nicht gefunden!' };
  }
  
  const newPath = path.join(newFolder, fileName);
  console.log('[UPDATE-MOVIE] Move file:', { oldPath, newPath });
  
  try {
    await moveVideoFile(oldPath, newPath);
    console.log('[UPDATE-MOVIE] Datei verschoben:', oldPath, '->', newPath);
    values.movieVideo = path.parse(fileName).name;
  } catch (err) {
    console.error('Fehler beim Verschieben der Videodatei:', err);
    return { error: 'Fehler beim Verschieben der Videodatei!' };
  }
  
  return {};
};

const updateMovieActors = async (movieId: string, movieActor: any): Promise<void> => {
  await db.movieActor.deleteMany({ where: { movieId } });
  
  if (Array.isArray(movieActor)) {
    for (const actorId of movieActor) {
      await db.movieActor.create({ data: { movieId, actorId } });
    }
  }
};

export const updateMovie = async (movieId: string, values: z.infer<typeof MovieSchema>, thumbnailUrl: string) => {
  const user = await currentUser();
  const role = await currentRole();

  logBackendAction('updateMovie_called', {
    userId: user?.id,
    userEmail: user?.email,
    role,
    movieId,
    values,
    thumbnailUrl,
  }, 'info');

  if (!user) {
    logBackendAction('updateMovie_unauthorized', { movieId, values }, 'error');
    return { error: "Unauthorized!" };
  }

  if (role !== UserRole.ADMIN) {
    logBackendAction('updateMovie_not_allowed', { userId: user.id, role, movieId }, 'error');
    return { error: "Not allowed Server Action!" };
  }

  const validatedField = MovieSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('updateMovie_invalid_fields', { userId: user.id, movieId, values }, 'error');
    return { error: "Invalid fields!" };
  }

  const movie = await db.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    return { error: "Movie not found!" }
  }

  const { movieName, movieDescripton, movieActor, movieType, movieGenre, movieDuration } = validatedField.data

  const moveResult = await handleVideoTypeChange(movie, movieType, values);
  if (moveResult.error) {
    return moveResult;
  }

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

  await updateMovieActors(movieId, movieActor);

  return { success: "Movie updated!" }
}