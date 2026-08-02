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

  it('redirects URL-based thumbnails without embedding them in JSON', async () => {
    mockedFindUnique.mockResolvedValue({ thumbnailUrl: '/uploads/poster.jpg' });

    const response = await GET(
      new Request('http://localhost/api/catalog/thumbnails/movie-2'),
      { params: Promise.resolve({ movieId: 'movie-2' }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/uploads/poster.jpg');
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
