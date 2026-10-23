import { createExistingPasskeyUserResolver } from '@/lib/authentication/passkey-user';

describe('createExistingPasskeyUserResolver', () => {
  it.each([{ method: 'POST' }, { method: 'GET' }, { method: 'POST', body: { email: '   ' } }, { method: 'GET', query: { email: 42 } }])('rejects absent or malformed account identifiers: %j', async request => {
    const findByEmail = jest.fn();
    const resolver = createExistingPasskeyUserResolver({ findByEmail, isBlocked: jest.fn() });
    await expect(resolver({} as never, request as never)).resolves.toBeNull();
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('resolves a normalized email from a GET authentication request', async () => {
    const user = { id: 'user', email: 'viewer@example.test', emailVerified: new Date(), isBlocked: false, blockedUntil: null };
    const findByEmail = jest.fn().mockResolvedValue(user);
    const resolver = createExistingPasskeyUserResolver({ findByEmail, isBlocked: jest.fn().mockResolvedValue(false) });
    await expect(resolver({} as never, { method: 'GET', query: { email: ' VIEWER@EXAMPLE.TEST ' } } as never)).resolves.toEqual({ user, exists: true });
    expect(findByEmail).toHaveBeenCalledWith('viewer@example.test');
  });
  it('returns null instead of creating an unknown account', async () => {
    const resolver = createExistingPasskeyUserResolver({
      findByEmail: jest.fn().mockResolvedValue(null),
      isBlocked: jest.fn(),
    });

    await expect(
      resolver({} as never, {
        method: 'POST',
        body: { email: 'unknown@example.test' },
      } as never),
    ).resolves.toBeNull();
  });

  it('rejects an account whose email has not been verified', async () => {
    const resolver = createExistingPasskeyUserResolver({
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Unverified User',
        email: 'user@example.test',
        emailVerified: null,
        isBlocked: false,
        blockedUntil: null,
      }),
      isBlocked: jest.fn().mockResolvedValue(false),
    });

    await expect(
      resolver({} as never, {
        method: 'POST',
        body: { email: 'USER@EXAMPLE.TEST' },
      } as never),
    ).resolves.toBeNull();
  });

  it('rejects a blocked account and returns only an eligible existing user', async () => {
    const user = {
      id: 'user-1',
      name: 'Verified User',
      email: 'user@example.test',
      emailVerified: new Date('2026-08-01T00:00:00.000Z'),
      isBlocked: false,
      blockedUntil: null,
    };
    const isBlocked = jest.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
    const resolver = createExistingPasskeyUserResolver({
      findByEmail: jest.fn().mockResolvedValue(user),
      isBlocked,
    });
    const request = {
      method: 'POST',
      body: { email: ' user@example.test ' },
    } as never;

    await expect(resolver({} as never, request)).resolves.toBeNull();
    await expect(resolver({} as never, request)).resolves.toEqual({
      user,
      exists: true,
    });
  });
});
