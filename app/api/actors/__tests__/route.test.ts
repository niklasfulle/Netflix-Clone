/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    actor: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    movieView: { groupBy: jest.fn() },
    adminAuditEvent: { create: jest.fn() },
  },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DELETE, GET, PATCH, POST } from '../route';

const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedDb = db as any;

describe('actors API error contract', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedIsAdmin.mockResolvedValue(true);
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  async function expectApiError(response: Response, status: number, code: string) {
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({
      error: { code, message: expect.any(String) },
    });
  }

  it('returns 403 when administrator access is missing', async () => {
    mockedIsAdmin.mockResolvedValue(false);
    await expectApiError(await GET(), 403, 'FORBIDDEN');
  });

  it('returns 400 for invalid actor input', async () => {
    const response = await POST(new Request('http://localhost/api/actors', {
      method: 'POST',
      body: JSON.stringify({ name: ' ' }),
    }));
    await expectApiError(response, 400, 'VALIDATION_ERROR');
  });

  it('returns 409 for duplicate actors', async () => {
    mockedDb.actor.findFirst.mockResolvedValue({ id: 'actor1' });
    const response = await POST(new Request('http://localhost/api/actors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Existing actor' }),
    }));
    await expectApiError(response, 409, 'CONFLICT');
  });

  it('returns 404 when an actor cannot be deleted because it does not exist', async () => {
    mockedDb.actor.findUnique.mockResolvedValue(null);
    const response = await DELETE(new Request('http://localhost/api/actors?id=missing', {
      method: 'DELETE',
    }));
    await expectApiError(response, 404, 'NOT_FOUND');
  });

  it('returns a sanitized 500 response for unexpected failures', async () => {
    mockedDb.actor.findMany.mockRejectedValue(new Error('database details'));
    mockedDb.movieView.groupBy.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
    expect(JSON.stringify(body)).not.toContain('database details');
  });

  it('records successful actor create, update, and delete mutations', async () => {
    mockedDb.actor.findFirst.mockResolvedValue(null);
    mockedDb.actor.create.mockResolvedValue({ id: 'actor-1', name: 'Actor One' });
    await POST(new Request('http://localhost/api/actors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Actor One' }),
    }));

    mockedDb.actor.update.mockResolvedValue({ id: 'actor-1', name: 'Actor Updated' });
    await PATCH(new Request('http://localhost/api/actors', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'actor-1', name: 'Actor Updated' }),
    }));

    mockedDb.actor.findUnique.mockResolvedValue({ id: 'actor-1', movies: [] });
    await DELETE(new Request('http://localhost/api/actors?id=actor-1', {
      method: 'DELETE',
    }));

    expect(mockedDb.adminAuditEvent.create.mock.calls.map(
      ([{ data }]: [{ data: { action: string; outcome: string } }]) => [data.action, data.outcome],
    )).toEqual([
      ['actor.create', 'SUCCEEDED'],
      ['actor.update', 'SUCCEEDED'],
      ['actor.delete', 'SUCCEEDED'],
    ]);
    expect(mockedDb.adminAuditEvent.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        targetId: 'actor-1',
        correlationId: expect.any(String),
        metadata: { associatedContentCount: 0 },
      }),
    });
  });
});
