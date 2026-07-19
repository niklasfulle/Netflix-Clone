import {
  compactPlaylistMovies,
  shuffleMovies,
} from '@/lib/random-playlist';
import type { Movie } from '@prisma/client';

const movies = [
  { id: '1', title: 'One' },
  { id: '2', title: 'Two' },
  { id: '3', title: 'Three' },
] as Movie[];

describe('shuffleMovies', () => {
  test('returns all movies without mutating the source array', () => {
    const originalOrder = movies.map((movie) => movie.id);
    const shuffled = shuffleMovies(movies);

    expect(shuffled).not.toBe(movies);
    expect(shuffled.map((movie) => movie.id).sort()).toEqual(
      [...originalOrder].sort()
    );
    expect(movies.map((movie) => movie.id)).toEqual(originalOrder);
  });

  test('supports empty and single-item playlists', () => {
    expect(shuffleMovies([])).toEqual([]);
    expect(shuffleMovies([movies[0]])).toEqual([movies[0]]);
  });

  test('keeps only fields required by the temporary player', () => {
    const movieWithLargeFields = {
      ...movies[0],
      thumbnailUrl: 'one.jpg',
      description: 'large description',
      videoUrl: 'large video path',
    } as Movie;

    expect(compactPlaylistMovies([movieWithLargeFields])).toEqual([
      {
        id: '1',
        title: 'One',
        thumbnailUrl: 'one.jpg',
      },
    ]);
  });

  test('omits embedded thumbnails that can exceed Safari storage quotas', () => {
    const moviesWithEmbeddedThumbnails = Array.from({ length: 20 }, (_, index) => ({
      id: String(index),
      title: `Video ${index}`,
      thumbnailUrl: `data:image/jpeg;base64,${'a'.repeat(170_000)}`,
    })) as Movie[];

    const compactMovies = compactPlaylistMovies(moviesWithEmbeddedThumbnails);
    const serialized = JSON.stringify(compactMovies);

    expect(compactMovies).toHaveLength(20);
    expect(compactMovies.every((movie) => movie.thumbnailUrl === undefined)).toBe(true);
    expect(serialized.length).toBeLessThan(2_000);
  });

  test('omits unexpectedly large thumbnail URLs', () => {
    const movie = {
      ...movies[0],
      thumbnailUrl: `https://example.com/${'a'.repeat(3_000)}`,
    } as Movie;

    expect(compactPlaylistMovies([movie])).toEqual([
      { id: '1', title: 'One' },
    ]);
  });
});
