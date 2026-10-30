/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    movie: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    movieView: { groupBy: jest.fn() },
    adminAuditEvent: { create: jest.fn() },
  },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { GET, PATCH } from '../route';

describe('administrator content category counts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(isCurrentUserAdmin).mockResolvedValue(true);
    jest.mocked(db.movie.count).mockResolvedValue(2);
    jest.mocked(db.movieView.groupBy).mockResolvedValue([]);
    jest.mocked(db.movie.findMany).mockResolvedValueOnce([
      { id: 'movie-1', categories: [{ categoryId: 'forest' }, { categoryId: 'city' }], categorySegments: [{ categoryId: 'forest' }, { categoryId: 'sea' }, { categoryId: 'sea' }] },
      { id: 'movie-2', categories: [], categorySegments: [] },
    ] as never).mockResolvedValueOnce([]);
  });

  it('counts distinct categories across both scopes without counting repeated intervals twice', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.movies[0]).toMatchObject({ categoryCount: 3, globalCategoryCount: 2, timelineCategoryCount: 2 });
    expect(result.movies[1]).toMatchObject({ categoryCount: 0, globalCategoryCount: 0, timelineCategoryCount: 0 });
    expect(result.movies[0]).not.toHaveProperty('categorySegments');
    expect(result.movies[0]).not.toHaveProperty('categories');
    expect(result.movies[0].thumbnailUrl).toBe('/api/catalog/thumbnails/movie-1');
    const query = jest.mocked(db.movie.findMany).mock.calls[0][0];
    expect(query?.select).toEqual(expect.objectContaining({
      title: true,
      status: true,
      actors: { select: { actor: { select: { name: true } } } },
    }));
    expect(query?.select).not.toHaveProperty('thumbnailUrl');
    expect(query?.select).not.toHaveProperty('videoUrl');
    expect(query?.select).not.toHaveProperty('description');
    expect(query).not.toHaveProperty('include');
  });

  it('keeps category counts restricted to administrators', async () => {
    jest.mocked(isCurrentUserAdmin).mockResolvedValue(false);
    expect((await GET()).status).toBe(403);
    expect(db.movie.findMany).not.toHaveBeenCalled();
  });
});

describe('administrator content status mutations', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(true);
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.movie.findMany as jest.Mock).mockResolvedValue([
      { id: 'movie-1', status: 'DRAFT' },
      { id: 'movie-2', status: 'ARCHIVED' },
    ]);
    (db.movie.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
  });

  it('records every published content target with its previous status', async () => {
    const response = await PATCH(new Request('http://localhost/api/movies/admin', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['movie-1', 'movie-2'], status: 'PUBLISHED' }),
    }));

    expect(response.status).toBe(200);
    expect((db as any).adminAuditEvent.create.mock.calls.map(
      ([{ data }]: [{ data: Record<string, unknown> }]) => data,
    )).toEqual([
      expect.objectContaining({
        action: 'content.publish',
        targetId: 'movie-1',
        outcome: 'SUCCEEDED',
        metadata: { previousStatus: 'DRAFT' },
      }),
      expect.objectContaining({
        action: 'content.publish',
        targetId: 'movie-2',
        outcome: 'SUCCEEDED',
        metadata: { previousStatus: 'ARCHIVED' },
      }),
    ]);
  });

  it('distinguishes archive and draft changes and keeps denied requests targetless', async () => {
    await PATCH(new Request('http://localhost/api/movies/admin', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['movie-1'], status: 'ARCHIVED' }),
    }));
    await PATCH(new Request('http://localhost/api/movies/admin', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['movie-1'], status: 'DRAFT' }),
    }));

    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(false);
    (currentUser as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'USER' });
    await PATCH(new Request('http://localhost/api/movies/admin', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['protected-movie'], status: 'PUBLISHED' }),
    }));

    const events = (db as any).adminAuditEvent.create.mock.calls.map(
      ([{ data }]: [{ data: Record<string, unknown> }]) => data,
    );
    expect(events[0]).toEqual(expect.objectContaining({ action: 'content.archive' }));
    expect(events[2]).toEqual(expect.objectContaining({
      action: 'content.update',
      metadata: {
        changedFields: ['status'],
        previousStatus: 'DRAFT',
        nextStatus: 'DRAFT',
      },
    }));
    expect(events.at(-1)).toEqual(expect.objectContaining({
      action: 'content.update',
      actorRole: 'USER',
      outcome: 'DENIED',
      targetId: null,
      metadata: expect.anything(),
    }));
    expect(JSON.stringify(events.at(-1))).not.toContain('protected-movie');
  });
});
