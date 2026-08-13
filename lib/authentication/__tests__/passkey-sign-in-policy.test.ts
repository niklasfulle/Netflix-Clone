import { isPasskeySignInAllowed } from '@/lib/authentication/passkey-sign-in-policy';

describe('isPasskeySignInAllowed', () => {
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
