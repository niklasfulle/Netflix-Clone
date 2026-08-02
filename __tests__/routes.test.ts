import { isPublicRoute } from '@/routes';

describe('isPublicRoute', () => {
  it('allows catalog thumbnail resources without exposing other catalog APIs', () => {
    expect(isPublicRoute('/api/catalog/thumbnails/movie-1')).toBe(true);
    expect(isPublicRoute('/api/catalog/thumbnails')).toBe(false);
    expect(isPublicRoute('/api/catalog/movies')).toBe(false);
  });
});
