/** @jest-environment node */

export {};

const mockCreatePasskeyManagement = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/data/passkeys', () => ({
  passkeyManagementRepository: { kind: 'passkey-repository' },
}));

jest.mock('@/lib/authentication/passkey-management', () => ({
  createPasskeyManagement: (...args: unknown[]) => mockCreatePasskeyManagement(...args),
}));

jest.mock('@/lib/db', () => ({
  db: { user: { findUnique: jest.fn() } },
}));

describe('passkey management runtime adapter', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnvironment, NODE_ENV: 'production' };
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    mockCreatePasskeyManagement.mockReturnValue({
      hasEnrollmentGrant: jest.fn(),
    });
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('allows production builds to import the adapter but rejects token hashing without a secret', async () => {
    await expect(import('@/lib/passkeys')).resolves.toBeDefined();
    const dependencies = mockCreatePasskeyManagement.mock.calls[0][0];

    expect(() => dependencies.hashToken('management-token')).toThrow(
      'AUTH_SECRET is required for passkey management',
    );
  });
});
