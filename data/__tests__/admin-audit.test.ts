/** @jest-environment node */

const mockAdminAuditEvent = { create: jest.fn() };
const mockExecuteRaw = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    adminAuditEvent: {
      create: (...args: unknown[]) => mockAdminAuditEvent.create(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}));

import { adminAuditRepository } from '@/data/admin-audit';

describe('administrator audit persistence adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appends the complete immutable audit event', async () => {
    const event = {
      id: 'audit-1',
      actorUserId: 'admin-1',
      actorRole: 'ADMIN' as const,
      action: 'content.update' as const,
      targetType: 'content' as const,
      targetId: 'movie-1',
      outcome: 'SUCCEEDED' as const,
      correlationId: 'request-1',
      metadata: { changedFields: ['title'] },
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
    };

    await adminAuditRepository.append(event);

    expect(mockAdminAuditEvent.create).toHaveBeenCalledWith({ data: event });
  });

  it('removes expired rows in one database-bounded batch', async () => {
    const cutoff = new Date('2025-08-14T10:00:00.000Z');
    mockExecuteRaw.mockResolvedValue(100);

    await expect(adminAuditRepository.removeBefore(cutoff, 100)).resolves.toBe(100);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });
});
