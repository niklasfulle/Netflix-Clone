import {
  AdminAuditReadAuthorizationError,
  createAdminAuditReader,
  type AdminAuditReadRepository,
} from '../admin-audit-reader';

function createRepository(): jest.Mocked<AdminAuditReadRepository> {
  return { search: jest.fn() };
}

describe('administrator audit reader', () => {
  it('normalizes filters and pagination before searching', async () => {
    const repository = createRepository();
    repository.search.mockResolvedValue({ events: [], total: 0 });
    const reader = createAdminAuditReader({
      repository,
      resolveActor: async () => ({ userId: 'admin-1', role: 'ADMIN' }),
    });

    await expect(reader.search({
      page: '2',
      pageSize: '50',
      actor: `  ${'a'.repeat(220)}  `,
      action: 'content.publish',
      targetType: 'content',
      outcome: 'SUCCEEDED',
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-14T23:59:59.999Z',
    })).resolves.toEqual({ events: [], total: 0, page: 2, pageSize: 50, totalPages: 0 });

    expect(repository.search).toHaveBeenCalledWith({
      page: 2,
      pageSize: 50,
      actor: 'a'.repeat(191),
      action: 'content.publish',
      targetType: 'content',
      outcome: 'SUCCEEDED',
      from: new Date('2026-08-01T00:00:00.000Z'),
      to: new Date('2026-08-14T23:59:59.999Z'),
    });
  });

  it('rejects regular users before the repository is queried', async () => {
    const repository = createRepository();
    const reader = createAdminAuditReader({
      repository,
      resolveActor: async () => ({ userId: 'user-1', role: 'USER' }),
    });

    await expect(reader.search({})).rejects.toBeInstanceOf(AdminAuditReadAuthorizationError);
    expect(repository.search).not.toHaveBeenCalled();
  });
});
