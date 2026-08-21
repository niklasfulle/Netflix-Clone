/** @jest-environment node */

export {};

const mockCurrentUser = jest.fn();
const mockCreateAdminAudit = jest.fn();

jest.mock('@/lib/auth', () => ({
  currentUser: (...args: unknown[]) => mockCurrentUser(...args),
}));

jest.mock('@/data/admin-audit', () => ({
  adminAuditRepository: { kind: 'admin-audit-repository' },
}));

jest.mock('@/lib/administration/admin-audit', () => ({
  createAdminAudit: (...args: unknown[]) => mockCreateAdminAudit(...args),
}));

describe('administrator audit runtime adapter', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCreateAdminAudit.mockReturnValue({ kind: 'admin-audit-module' });
  });

  it('resolves the actor exclusively from the authenticated server session', async () => {
    mockCurrentUser
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce(undefined);

    const { adminAudit } = await import('@/lib/admin-audit');
    const dependencies = mockCreateAdminAudit.mock.calls[0][0];

    expect(adminAudit).toEqual({ kind: 'admin-audit-module' });
    await expect(dependencies.resolveActor()).resolves.toEqual({
      userId: 'admin-1',
      role: 'ADMIN',
    });
    await expect(dependencies.resolveActor()).resolves.toBeNull();
    expect(dependencies.repository).toEqual({ kind: 'admin-audit-repository' });
    expect(dependencies.createId()).toMatch(/^[0-9a-f-]{36}$/);
    expect(dependencies.now()).toBeInstanceOf(Date);
  });
});
