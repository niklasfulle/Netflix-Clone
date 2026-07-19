import type { Movie } from '@prisma/client';

export const RANDOM_PLAYLIST_STORAGE_KEY = 'randomActorPlaylist';

export type RandomPlaylistMovie = Pick<Movie, 'id' | 'title'> &
  Partial<Pick<Movie, 'thumbnailUrl'>>;

export interface RandomPlaylist {
  title: string;
  movies: RandomPlaylistMovie[];
  returnPath: string;
}

export function compactPlaylistMovies(
  movies: Movie[]
): RandomPlaylistMovie[] {
  return movies.map(({ id, title, thumbnailUrl }) => {
    const canStoreThumbnail =
      Boolean(thumbnailUrl) &&
      thumbnailUrl.length <= 2048 &&
      !/^(?:data|blob):/i.test(thumbnailUrl);

    return {
      id,
      title,
      ...(canStoreThumbnail ? { thumbnailUrl } : {}),
    };
  });
}

export function shuffleMovies(movies: Movie[]): Movie[] {
  const shuffled = [...movies];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}
