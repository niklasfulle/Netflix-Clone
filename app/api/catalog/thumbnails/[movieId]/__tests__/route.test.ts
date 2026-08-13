/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: { movie: { findUnique: jest.fn() } },
}));

import { db } from '@/lib/db';
import { GET } from '../route';

const mockedFindUnique = db.movie.findUnique as jest.Mock;

describe('catalog thumbnail route', () => {
  beforeEach(() => jest.resetAllMocks());

  it('serves an inline thumbnail as a cacheable image resource', async () => {
    mockedFindUnique.mockResolvedValue({
      thumbnailUrl: 'data:image/jpeg;base64,aGVsbG8=',
    });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-1'),
      { params: Promise.resolve({ movieId: 'movie-1' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toContain('public');
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('hello');
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
      select: { thumbnailUrl: true },
    });
  });

  it('serves the seeded local poster as a non-empty image response', async () => {
    mockedFindUnique.mockResolvedValue({ thumbnailUrl: '/images/hero.jpg' });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-2'),
      { params: Promise.resolve({ movieId: 'movie-2' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('redirects external thumbnails without embedding them in JSON', async () => {
    mockedFindUnique.mockResolvedValue({ thumbnailUrl: 'https://cdn.example.test/poster.jpg' });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-3'),
      { params: Promise.resolve({ movieId: 'movie-3' }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://cdn.example.test/poster.jpg');
  });

  it('returns not found when a configured local poster is missing', async () => {
    mockedFindUnique.mockResolvedValue({ thumbnailUrl: '/images/does-not-exist.jpg' });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-4'),
      { params: Promise.resolve({ movieId: 'movie-4' }) },
    );

    expect(response.status).toBe(404);
    expect((await response.arrayBuffer()).byteLength).toBe(0);
  });

  it('rejects local paths outside the public image directory', async () => {
    mockedFindUnique.mockResolvedValue({ thumbnailUrl: '/../package.json' });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-5'),
      { params: Promise.resolve({ movieId: 'movie-5' }) },
    );

    expect(response.status).toBe(415);
  });

  it('returns not found for an unknown movie', async () => {
    mockedFindUnique.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/missing'),
      { params: Promise.resolve({ movieId: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });
});
