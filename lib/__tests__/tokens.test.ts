/** @jest-environment node */

jest.mock('@/data/verification-token', () => ({ getVerificationTokenByEmail: jest.fn() }));
jest.mock('@/data/password-reset-token', () => ({ getPasswordResetTokenByEmail: jest.fn() }));
jest.mock('@/data/two-factor-token', () => ({ getTwoFactorTokenByEmail: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: {
    verificationToken: { create: jest.fn(), delete: jest.fn() },
    passwordResetToken: { create: jest.fn(), delete: jest.fn() },
    twoFactorToken: { create: jest.fn(), delete: jest.fn() },
  },
}));

import { db } from '@/lib/db';
import { getVerificationTokenByEmail } from '@/data/verification-token';
import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import {
  generatePasswordResetToken,
  generateTwoFactorToken,
  generateVerificationToken,
} from '../tokens';
import { hashOneTimeToken } from '@/lib/authentication/token-crypto';

const mockedDb = db as any;
const mockedVerification = getVerificationTokenByEmail as jest.Mock;
const mockedPasswordReset = getPasswordResetTokenByEmail as jest.Mock;
const mockedTwoFactor = getTwoFactorTokenByEmail as jest.Mock;

describe('token generators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.verificationToken.create.mockImplementation(({ data }: any) => data);
    mockedDb.passwordResetToken.create.mockImplementation(({ data }: any) => data);
    mockedDb.twoFactorToken.create.mockImplementation(({ data }: any) => data);
  });

  it('replaces existing verification tokens', async () => {
    mockedVerification.mockResolvedValue({ id: 'old-token' });
    const result = await generateVerificationToken('user@example.com');
    expect(mockedDb.verificationToken.delete).toHaveBeenCalledWith({ where: { id: 'old-token' } });
    expect(result).toMatchObject({ email: 'user@example.com' });
    expect(mockedDb.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'user@example.com',
        tokenHash: hashOneTimeToken('verification', result.token),
      }),
    });
    expect(mockedDb.verificationToken.create.mock.calls[0][0].data).not.toHaveProperty('token');
  });

  it('creates verification tokens without deleting when none exists', async () => {
    mockedVerification.mockResolvedValue(null);
    await generateVerificationToken('user@example.com');
    expect(mockedDb.verificationToken.delete).not.toHaveBeenCalled();
  });

  it('replaces existing password-reset tokens', async () => {
    mockedPasswordReset.mockResolvedValue({ id: 'old-token' });
    const result = await generatePasswordResetToken('user@example.com');
    expect(mockedDb.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'old-token' } });
    expect(result).toMatchObject({ email: 'user@example.com' });
    expect(mockedDb.passwordResetToken.create.mock.calls[0][0].data).toMatchObject({
      tokenHash: hashOneTimeToken('password-reset', result.token),
    });
    expect(mockedDb.passwordResetToken.create.mock.calls[0][0].data).not.toHaveProperty('token');
  });

  it('creates six-digit two-factor tokens and replaces old tokens', async () => {
    mockedTwoFactor.mockResolvedValue({ id: 'old-token' });
    const result = await generateTwoFactorToken('user@example.com');
    expect(mockedDb.twoFactorToken.delete).toHaveBeenCalledWith({ where: { id: 'old-token' } });
    expect(result.email).toBe('user@example.com');
    expect(result.token).toMatch(/^\d{6}$/);
    expect(mockedDb.twoFactorToken.create.mock.calls[0][0].data).toMatchObject({
      tokenHash: hashOneTimeToken('two-factor', result.token),
    });
    expect(mockedDb.twoFactorToken.create.mock.calls[0][0].data).not.toHaveProperty('token');
  });

  it('binds email-change verification to the authenticated user and target address', async () => {
    mockedVerification.mockResolvedValue(null);
    await generateVerificationToken('new@example.com', {
      userId: 'user-1',
      targetEmail: 'new@example.com',
    });

    expect(mockedDb.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'new@example.com',
        userId: 'user-1',
        targetEmail: 'new@example.com',
      }),
    });
  });
});
