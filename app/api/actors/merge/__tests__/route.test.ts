/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    actor: { findUnique: jest.fn() },
    adminAuditEvent: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { POST } from '../route';

describe('actor merge API', () => {
  const transaction = {
    movieActor: { createMany: jest.fn(), deleteMany: jest.fn() },
    actor: { delete: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(true);
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.actor.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'actor-source',
        movies: [{ movieId: 'movie-1' }, { movieId: 'movie-2' }],
      })
      .mockResolvedValueOnce({ id: 'actor-target' });
    (db.$transaction as jest.Mock).mockImplementation(async (callback) => callback(transaction));
  });

  it('records a successful merge without persisting actor names', async () => {
    const response = await POST(new Request('http://localhost/api/actors/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceId: 'actor-source', targetId: 'actor-target' }),
    }));

    expect(response.status).toBe(200);
    expect((db as any).adminAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'actor.merge',
        targetId: 'actor-target',
        outcome: 'SUCCEEDED',
        correlationId: expect.any(String),
        metadata: { mergedCount: 2 },
      }),
    });
  });
});
