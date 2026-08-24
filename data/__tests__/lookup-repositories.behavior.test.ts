jest.mock('@/lib/db', () => ({
  db: {
    account: { findFirst: jest.fn() },
    passwordResetToken: { findFirst: jest.fn() },
    twoFactorConfirmation: { findUnique: jest.fn() },
    twoFactorToken: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    verificationToken: { findFirst: jest.fn() },
  },
}));

import { getAccountByUserId } from '@/data/account';
import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getUserByEmail, getUserById } from '@/data/user';
import { getVerificationTokenByEmail } from '@/data/verification-token';
import { db } from '@/lib/db';

const accountLookup = db.account.findFirst as jest.Mock;
const passwordResetLookup = db.passwordResetToken.findFirst as jest.Mock;
const twoFactorConfirmationLookup = db.twoFactorConfirmation.findUnique as jest.Mock;
const twoFactorTokenLookup = db.twoFactorToken.findFirst as jest.Mock;
const userLookup = db.user.findUnique as jest.Mock;
const verificationTokenLookup = db.verificationToken.findFirst as jest.Mock;

describe('authentication lookup repositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the non-passkey account for a user', async () => {
    const account = { id: 'account-1', userId: 'user-1', provider: 'github' };
    accountLookup.mockResolvedValue(account);

    await expect(getAccountByUserId('user-1')).resolves.toBe(account);
    expect(accountLookup).toHaveBeenCalledWith({
      where: { userId: 'user-1', provider: { not: 'passkey' } },
    });
  });

  it('returns null when the account lookup fails', async () => {
    accountLookup.mockRejectedValue(new Error('database unavailable'));

    await expect(getAccountByUserId('user-1')).resolves.toBeNull();
  });

  it('returns a password-reset token by email and handles lookup failures', async () => {
    const token = { id: 'reset-1', email: 'viewer@example.com' };
    passwordResetLookup.mockResolvedValueOnce(token).mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getPasswordResetTokenByEmail('viewer@example.com')).resolves.toBe(token);
    await expect(getPasswordResetTokenByEmail('viewer@example.com')).resolves.toBeNull();
    expect(passwordResetLookup).toHaveBeenNthCalledWith(1, {
      where: { email: 'viewer@example.com' },
    });
  });

  it('returns a two-factor confirmation by user and handles lookup failures', async () => {
    const confirmation = { id: 'confirmation-1', userId: 'user-1' };
    twoFactorConfirmationLookup
      .mockResolvedValueOnce(confirmation)
      .mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getTwoFactorConfirmationByUserId('user-1')).resolves.toBe(confirmation);
    await expect(getTwoFactorConfirmationByUserId('user-1')).resolves.toBeNull();
    expect(twoFactorConfirmationLookup).toHaveBeenNthCalledWith(1, {
      where: { userId: 'user-1' },
    });
  });

  it('returns a two-factor token by email and handles lookup failures', async () => {
    const token = { id: 'two-factor-1', email: 'viewer@example.com' };
    twoFactorTokenLookup.mockResolvedValueOnce(token).mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getTwoFactorTokenByEmail('viewer@example.com')).resolves.toBe(token);
    await expect(getTwoFactorTokenByEmail('viewer@example.com')).resolves.toBeNull();
    expect(twoFactorTokenLookup).toHaveBeenNthCalledWith(1, {
      where: { email: 'viewer@example.com' },
    });
  });

  it('returns users by email and id and handles lookup failures', async () => {
    const userByEmail = { id: 'user-1', email: 'viewer@example.com' };
    const userById = { id: 'user-2', email: 'admin@example.com' };
    userLookup
      .mockResolvedValueOnce(userByEmail)
      .mockResolvedValueOnce(userById)
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getUserByEmail('viewer@example.com')).resolves.toBe(userByEmail);
    await expect(getUserById('user-2')).resolves.toBe(userById);
    await expect(getUserByEmail('viewer@example.com')).resolves.toBeNull();
    await expect(getUserById('user-2')).resolves.toBeNull();
    expect(userLookup).toHaveBeenNthCalledWith(1, { where: { email: 'viewer@example.com' } });
    expect(userLookup).toHaveBeenNthCalledWith(2, { where: { id: 'user-2' } });
  });

  it('returns a verification token by email and handles lookup failures', async () => {
    const token = { id: 'verification-1', email: 'viewer@example.com' };
    verificationTokenLookup.mockResolvedValueOnce(token).mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getVerificationTokenByEmail('viewer@example.com')).resolves.toBe(token);
    await expect(getVerificationTokenByEmail('viewer@example.com')).resolves.toBeNull();
    expect(verificationTokenLookup).toHaveBeenNthCalledWith(1, {
      where: { email: 'viewer@example.com' },
    });
  });
});
