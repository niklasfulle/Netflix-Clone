/** @jest-environment node */

export {};

const mockIsCurrentUserAdmin = jest.fn();
const mockCreateAdminAuditReader = jest.fn();
const mockCreateMediaHealthReader = jest.fn();
const mockResolvePasskeyConfiguration = jest.fn();
const mockCreateExistingPasskeyUserResolver = jest.fn();
const mockCreatePasskeyProvider = jest.fn();
const mockCreateJobSubmissionService = jest.fn();
const mockCreateJobControlService = jest.fn();
const mockPublisher = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue('queue-job-123'),
  cancel: jest.fn().mockResolvedValue(undefined),
};
const mockPgBoss = jest.fn((options: unknown) => {
  if (!options) throw new Error('PgBoss options are required');
  return mockPublisher;
});

jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: (...args: unknown[]) => mockIsCurrentUserAdmin(...args) }));
jest.mock('@/data/admin-audit-reader', () => ({ adminAuditReadRepository: { kind: 'audit-reader-repository' } }));
jest.mock('@/lib/administration/admin-audit-reader', () => ({ createAdminAuditReader: (...args: unknown[]) => mockCreateAdminAuditReader(...args) }));
jest.mock('@/data/media-health', () => ({ mediaHealthRepository: { kind: 'media-health-repository' } }));
jest.mock('@/lib/media-probe', () => ({ checkFfprobeAvailability: jest.fn() }));
jest.mock('@/lib/administration/media-health', () => ({ createMediaHealthReader: (...args: unknown[]) => mockCreateMediaHealthReader(...args) }));
jest.mock('@/data/user', () => ({ getUserByEmail: jest.fn() }));
jest.mock('@/lib/user-access', () => ({ hasActiveUserBlock: jest.fn() }));
jest.mock('@/lib/authentication/passkey-configuration', () => ({ resolvePasskeyConfiguration: (...args: unknown[]) => mockResolvePasskeyConfiguration(...args) }));
jest.mock('@/lib/authentication/passkey-user', () => ({ createExistingPasskeyUserResolver: (...args: unknown[]) => mockCreateExistingPasskeyUserResolver(...args) }));
jest.mock('@/lib/authentication/passkey-provider', () => ({ createPasskeyProvider: (...args: unknown[]) => mockCreatePasskeyProvider(...args) }));
jest.mock('@/lib/db', () => ({ db: { kind: 'database' } }));
jest.mock('@/lib/jobs/submission', () => ({ createJobSubmissionService: (...args: unknown[]) => mockCreateJobSubmissionService(...args) }));
jest.mock('@/lib/jobs/control', () => ({ createJobControlService: (...args: unknown[]) => mockCreateJobControlService(...args) }));
jest.mock('pg-boss', () => ({
  PgBoss: function PgBoss(options: unknown) {
    return mockPgBoss(options);
  },
}));

describe('production runtime adapters', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('builds the administrator audit reader from the authenticated server actor', async () => {
    mockCreateAdminAuditReader.mockReturnValue({ kind: 'audit-reader' });
    mockIsCurrentUserAdmin.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const { adminAuditReader } = await import('@/lib/admin-audit-reader');
    const dependencies = mockCreateAdminAuditReader.mock.calls[0][0];

    expect(adminAuditReader).toEqual({ kind: 'audit-reader' });
    await expect(dependencies.resolveActor()).resolves.toEqual({
      userId: 'current-administrator',
      role: 'ADMIN',
    });
    await expect(dependencies.resolveActor()).resolves.toBeNull();
    expect(dependencies.repository).toEqual({ kind: 'audit-reader-repository' });
  });

  it('builds the media-health reader with the production repository and probe', async () => {
    mockCreateMediaHealthReader.mockReturnValue({ kind: 'media-health-reader' });

    const { mediaHealthReader } = await import('@/lib/media-health');

    expect(mediaHealthReader).toEqual({ kind: 'media-health-reader' });
    expect(mockCreateMediaHealthReader).toHaveBeenCalledWith({
      repository: { kind: 'media-health-repository' },
      checkAvailability: expect.any(Function),
    });
  });

  it('exposes passkey availability from the resolved production configuration', async () => {
    const configuration = { enabled: true, rpId: 'netflix.example' };
    const resolver = jest.fn();
    mockResolvePasskeyConfiguration.mockReturnValue(configuration);
    mockCreateExistingPasskeyUserResolver.mockReturnValue(resolver);
    mockCreatePasskeyProvider.mockReturnValue({ kind: 'passkey-provider' });
    process.env.AUTH_PASSKEYS_ENABLED = 'true';
    process.env.AUTH_WEBAUTHN_RP_ID = 'netflix.example';

    const runtime = await import('@/lib/passkey-provider');

    expect(runtime.passkeysEnabled).toBe(true);
    expect(runtime.configuredPasskeyProvider).toEqual({ kind: 'passkey-provider' });
    expect(mockCreatePasskeyProvider).toHaveBeenCalledWith(configuration, resolver);
  });

  it('constructs PostgreSQL-backed submission and control services', async () => {
    process.env.POSTGRESQL_URL = 'postgresql://database.example/netflix';
    const get = jest.fn().mockResolvedValue({ kind: 'job-status' });
    mockCreateJobSubmissionService.mockImplementation(({ publisher }) => ({
      async submit(value: unknown) {
        await publisher.send('runtime-adapter-test', value, {});
        return { kind: 'accepted-job' };
      },
    }));
    mockCreateJobControlService.mockImplementation(({ queue }) => ({
      get,
      async cancel() {
        await queue.cancel('queue-job-123');
        return { kind: 'cancelled-job' };
      },
    }));

    const runtime = await import('@/lib/jobs/runtime');

    expect(mockPgBoss).not.toHaveBeenCalled();
    await expect(runtime.backgroundJobSubmission.submit({ kind: 'submission' }))
      .resolves.toEqual({ kind: 'accepted-job' });
    await expect(runtime.backgroundJobControl.get('job-run-123', {
      userId: 'admin-user-123',
      role: 'ADMIN',
    })).resolves.toEqual({ kind: 'job-status' });
    await expect(runtime.backgroundJobControl.cancel('job-run-123', {
      userId: 'admin-user-123',
      role: 'ADMIN',
    })).resolves.toEqual({ kind: 'cancelled-job' });
    expect(mockPgBoss).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: 'postgresql://database.example/netflix',
      schema: 'pgboss',
      migrate: false,
    }));
    expect(mockPgBoss).toHaveBeenCalledTimes(1);
    expect(mockPublisher.start).toHaveBeenCalledTimes(1);
  });

  it('defers the missing background-job database URL failure until runtime use', async () => {
    delete process.env.POSTGRESQL_URL;
    mockCreateJobSubmissionService.mockImplementation(({ publisher }) => ({
      async submit(value: unknown) {
        await publisher.send('runtime-adapter-test', value, {});
        return { kind: 'accepted-job' };
      },
    }));

    const runtime = await import('@/lib/jobs/runtime');

    expect(mockPgBoss).not.toHaveBeenCalled();
    await expect(runtime.backgroundJobSubmission.submit({} as never)).rejects.toThrow(
      'POSTGRESQL_URL is required for background jobs',
    );
  });
});
