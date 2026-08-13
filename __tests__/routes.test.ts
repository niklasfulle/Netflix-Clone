import { isPublicRoute } from '@/routes';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('isPublicRoute', () => {
  it('allows catalog thumbnail resources without exposing other catalog APIs', () => {
    expect(isPublicRoute('/api/catalog/thumbnails/movie-1')).toBe(true);
    expect(isPublicRoute('/api/catalog/thumbnails')).toBe(false);
    expect(isPublicRoute('/api/catalog/movies')).toBe(false);
  });

  it('keeps the public changelog outside the protected route group', () => {
    expect(isPublicRoute('/changelog')).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'app/changelog/page.tsx'))).toBe(true);
    expect(
      existsSync(resolve(process.cwd(), 'app/(protected)/changelog/page.tsx')),
    ).toBe(false);
  });
});
