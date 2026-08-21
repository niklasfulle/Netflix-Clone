import {
  AdminAuditAuthorizationError,
  AdminAuditPersistenceError,
  AdminAuditValidationError,
  createAdminAudit,
  type AdminAuditRepository,
} from '../admin-audit';

function createRepository(): jest.Mocked<AdminAuditRepository> {
  return {
    append: jest.fn(),
    removeBefore: jest.fn(),
  };
}

describe('administrator audit module', () => {
  it('records the authenticated administrator and only allowlisted metadata', async () => {
    const repository = createRepository();
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'audit-1',
    });

    await expect(audit.record({
      action: 'content.update',
      target: { type: 'content', id: 'movie-1' },
      outcome: 'SUCCEEDED',
      correlationId: 'request-1',
      metadata: {
        changedFields: ['title', 'status'],
        previousStatus: 'DRAFT',
        nextStatus: 'PUBLISHED',
        password: 'must-not-be-stored',
      },
    })).resolves.toEqual({ id: 'audit-1' });

    expect(repository.append).toHaveBeenCalledWith({
      id: 'audit-1',
      actorUserId: 'admin-1',
      actorRole: 'ADMIN',
      action: 'content.update',
      targetType: 'content',
      targetId: 'movie-1',
      outcome: 'SUCCEEDED',
      correlationId: 'request-1',
      metadata: {
        changedFields: ['title', 'status'],
        previousStatus: 'DRAFT',
        nextStatus: 'PUBLISHED',
      },
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
    });
    expect(JSON.stringify(repository.append.mock.calls)).not.toContain('must-not-be-stored');
  });

  it('rejects non-administrators before an event can be written', async () => {
    const repository = createRepository();
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'user-1', role: 'USER' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'unused',
    });

    await expect(audit.record({
      action: 'user.block',
      target: { type: 'user', id: 'user-2' },
      outcome: 'DENIED',
    })).rejects.toBeInstanceOf(AdminAuditAuthorizationError);
    expect(repository.append).not.toHaveBeenCalled();
  });

  it('records an authenticated non-administrator only as a denied authorization attempt', async () => {
    const repository = createRepository();
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'user-1', role: 'USER' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'audit-denied-1',
    });

    await expect(audit.recordAuthorizationDenial({
      action: 'user.block',
      correlationId: 'request-denied-1',
    })).resolves.toEqual({ id: 'audit-denied-1' });

    expect(repository.append).toHaveBeenCalledWith({
      id: 'audit-denied-1',
      actorUserId: 'user-1',
      actorRole: 'USER',
      action: 'user.block',
      targetType: null,
      targetId: null,
      outcome: 'DENIED',
      correlationId: 'request-denied-1',
      metadata: null,
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
    });
  });

  it('surfaces persistence failures so destructive callers can fail closed', async () => {
    const repository = createRepository();
    repository.append.mockRejectedValue(new Error('database unavailable'));
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'audit-1',
    });

    await expect(audit.record({
      action: 'content.delete',
      target: { type: 'content', id: 'movie-1' },
      outcome: 'SUCCEEDED',
    })).rejects.toBeInstanceOf(AdminAuditPersistenceError);
  });

  it('removes expired events in a bounded retention batch', async () => {
    const repository = createRepository();
    repository.removeBefore.mockResolvedValue(75);
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'unused',
    });

    await expect(audit.maintainRetention()).resolves.toEqual({ removed: 75 });
    expect(repository.removeBefore).toHaveBeenCalledWith(
      new Date('2025-08-14T10:00:00.000Z'),
      100,
    );
  });

  it('bounds identifiers and metadata before persistence', async () => {
    const repository = createRepository();
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: `  ${'u'.repeat(250)}  `, role: 'ADMIN' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'audit-1',
    });

    await audit.record({
      action: 'media.scan',
      target: { type: 'media_scan', id: `  ${'t'.repeat(250)}  ` },
      outcome: 'FAILED',
      correlationId: `  ${'c'.repeat(180)}  `,
      metadata: {
        scope: `  ${'s'.repeat(250)}  `,
        itemCount: Number.POSITIVE_INFINITY,
      },
    });

    expect(repository.append).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: 'u'.repeat(191),
      targetId: 't'.repeat(191),
      correlationId: 'c'.repeat(128),
      metadata: { scope: 's'.repeat(200) },
    }));
  });

  it('rejects an empty target instead of persisting an ambiguous event', async () => {
    const repository = createRepository();
    const audit = createAdminAudit({
      repository,
      resolveActor: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
      now: () => new Date('2026-08-14T10:00:00.000Z'),
      createId: () => 'audit-1',
    });

    await expect(audit.record({
      action: 'content.delete',
      target: { type: 'content', id: ' \u0000 ' },
      outcome: 'FAILED',
    })).rejects.toBeInstanceOf(AdminAuditValidationError);
    expect(repository.append).not.toHaveBeenCalled();
  });
});
