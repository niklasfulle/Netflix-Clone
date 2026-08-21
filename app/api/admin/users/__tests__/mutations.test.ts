/** @jest-environment node */

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/session-security', () => ({
  currentSecurityContext: jest.fn().mockResolvedValue({}),
  sessionSecurity: { revokeAllSessions: jest.fn() },
}));
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminAuditEvent: { create: jest.fn() },
  },
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { POST as setBlocked } from '../block/route';
import { PATCH as changeRole } from '../route';

describe('administrator user mutations', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(true);
    (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ role: 'USER' });
    (db.user.update as jest.Mock).mockImplementation(({ data }) => ({ id: 'user-1', ...data }));
    (db.user.count as jest.Mock).mockResolvedValue(2);
  });

  it('records role, block, and unblock changes with bounded metadata', async () => {
    expect((await changeRole(new Request('http://localhost/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', role: 'ADMIN' }),
    }))).status).toBe(200);

    expect((await setBlocked(new Request('http://localhost/api/admin/users/block', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', block: true, reason: 'private free text' }),
    }))).status).toBe(200);

    expect((await setBlocked(new Request('http://localhost/api/admin/users/block', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', block: false }),
    }))).status).toBe(200);

    const events = (db as any).adminAuditEvent.create.mock.calls.map(
      ([{ data }]: [{ data: Record<string, unknown> }]) => data,
    );
    expect(events).toEqual([
      expect.objectContaining({
        action: 'user.role_change',
        targetId: 'user-1',
        outcome: 'SUCCEEDED',
        metadata: { previousRole: 'USER', nextRole: 'ADMIN' },
      }),
      expect.objectContaining({
        action: 'user.block',
        targetId: 'user-1',
        outcome: 'SUCCEEDED',
        metadata: { reasonCode: 'provided', hasExpiry: false },
      }),
      expect.objectContaining({
        action: 'user.unblock',
        targetId: 'user-1',
        outcome: 'SUCCEEDED',
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain('private free text');
  });
});
