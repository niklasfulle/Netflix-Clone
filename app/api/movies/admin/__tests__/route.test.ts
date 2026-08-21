/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    movie: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    adminAuditEvent: { create: jest.fn() },
  },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PATCH } from '../route';

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
