import { isPasskeySignInAllowed } from '@/lib/authentication/passkey-sign-in-policy';

describe('isPasskeySignInAllowed', () => {
  it('leaves other authentication providers independent of passkey enrollment grants', async () => {
    const dependencies = { findAccount: jest.fn(), hasManagementGrant: jest.fn() };
    await expect(isPasskeySignInAllowed({ provider: 'credentials', providerAccountId: 'account', userId: 'user' }, dependencies)).resolves.toBe(true);
    expect(dependencies.findAccount).not.toHaveBeenCalled();
    expect(dependencies.hasManagementGrant).not.toHaveBeenCalled();
  });
  it('allows an existing passkey login without a management grant', async () => {
    const findAccount = jest.fn().mockResolvedValue({ id: 'account-1' });
    const hasManagementGrant = jest.fn();

    await expect(
      isPasskeySignInAllowed(
        {
          provider: 'passkey',
          providerAccountId: 'provider-account-1',
          userId: 'user-1',
        },
        { findAccount, hasManagementGrant },
      ),
    ).resolves.toBe(true);
    expect(hasManagementGrant).not.toHaveBeenCalled();
  });

  it('requires a recent management grant before creating a new passkey account', async () => {
    const findAccount = jest.fn().mockResolvedValue(null);
    const hasManagementGrant = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const input = {
      provider: 'passkey',
      providerAccountId: 'provider-account-1',
      userId: 'user-1',
    };

    await expect(
      isPasskeySignInAllowed(input, { findAccount, hasManagementGrant }),
    ).resolves.toBe(false);
    await expect(
      isPasskeySignInAllowed(input, { findAccount, hasManagementGrant }),
    ).resolves.toBe(true);
  });
});
