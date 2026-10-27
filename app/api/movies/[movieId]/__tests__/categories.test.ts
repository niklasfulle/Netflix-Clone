/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { profil: { findFirst: jest.fn() }, movie: { findUnique: jest.fn() }, movieWatchTime: { findFirst: jest.fn() } } }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));

import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { GET } from '../route';

it('returns category names for display and stable IDs for editing the same assignments', async () => {
  jest.mocked(currentUser).mockResolvedValue({ id: 'user-1' } as never);
  jest.mocked(db.profil.findFirst).mockResolvedValue({ id: 'profile-1' } as never);
  jest.mocked(db.movie.findUnique).mockResolvedValue({ id: 'movie-1', status: 'PUBLISHED', actors: [], categorySegments: [{ categoryId: 'category-1', startSeconds: 10, endSeconds: 20, category: { id: 'category-1', name: 'Documentary' } }], categories: [
    { movieId: 'movie-1', categoryId: 'category-1', category: { id: 'category-1', name: 'Documentary', normalizedName: 'documentary' } },
  ] } as never);
  const response = await GET(new Request('http://localhost/api/movies/movie-1') as NextRequest, { params: Promise.resolve({ movieId: 'movie-1' }) });
  const result = await response.json();
  expect(response.status).toBe(200);
  expect(result.categoryIds).toEqual(['category-1']);
  expect(result.categories).toEqual([{ id: 'category-1', name: 'Documentary' }]);
  expect(result.categorySegments[0]).toMatchObject({ startSeconds: 10, endSeconds: 20, categoryId: 'category-1' });
});

it('does not expose draft timeline categories to a regular viewer', async () => {
  jest.mocked(currentUser).mockResolvedValue({ id: 'user-1', role: 'USER' } as never);
  jest.mocked(db.profil.findFirst).mockResolvedValue({ id: 'profile-1' } as never);
  jest.mocked(db.movie.findUnique).mockResolvedValue({ id: 'movie-1', status: 'DRAFT', actors: [], categories: [] } as never);
  expect((await GET(new Request('http://localhost/api/movies/movie-1') as NextRequest, { params: Promise.resolve({ movieId: 'movie-1' }) })).status).toBe(404);
});
