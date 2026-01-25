jest.mock('@/auth', () => ({
  signIn: jest.fn(),
}));

jest.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(type: string) {
      super(type);
      this.type = type;
      this.name = 'AuthError';
    }
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendTwoFactorEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generateTwoFactorToken: jest.fn(),
  generateVerificationToken: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    twoFactorToken: {
      delete: jest.fn(),
    },
    twoFactorConfirmation: {
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/data/two-factor-token', () => ({
  getTwoFactorTokenByEmail: jest.fn(),
}));

jest.mock('@/data/two-factor-confirmation', () => ({
  getTwoFactorConfirmationByUserId: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

import { login } from '../login';
import { signIn } from '@/auth';
import { logBackendAction } from '@/lib/logger';
import { sendTwoFactorEmail, sendVerificationEmail } from '@/lib/mail';
import { generateTwoFactorToken, generateVerificationToken } from '@/lib/tokens';
import { db } from '@/lib/db';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getUserByEmail } from '@/data/user';

describe('login action - Authentication & Email Verification', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockLogBackendAction = logBackendAction as jest.MockedFunction<typeof logBackendAction>;
  const mockSendTwoFactorEmail = sendTwoFactorEmail as jest.MockedFunction<typeof sendTwoFactorEmail>;
  const mockSendVerificationEmail = sendVerificationEmail as jest.MockedFunction<typeof sendVerificationEmail>;
  const mockGenerateTwoFactorToken = generateTwoFactorToken as jest.MockedFunction<typeof generateTwoFactorToken>;
  const mockGenerateVerificationToken = generateVerificationToken as jest.MockedFunction<typeof generateVerificationToken>;
  const mockGetTwoFactorConfirmationByUserId = getTwoFactorConfirmationByUserId as jest.MockedFunction<typeof getTwoFactorConfirmationByUserId>;
  const mockGetTwoFactorTokenByEmail = getTwoFactorTokenByEmail as jest.MockedFunction<typeof getTwoFactorTokenByEmail>;
  const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    hashedPassword: 'hashed-password',
    emailVerified: new Date(),
    isTwoFactorEnabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserByEmail.mockResolvedValue(mockUser as any);
    mockSignIn.mockResolvedValue(undefined);
  });

  it('✅ should successfully login with valid credentials', async () => {
    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('✅ should call signIn with credentials provider', async () => {
    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.any(Object));
  });

  it('❌ should return error for invalid email format', async () => {
    const result = await login({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  it('❌ should return error for empty password', async () => {
    const result = await login({
      email: 'test@example.com',
      password: '',
    });
    expect(result).toEqual({ error: 'Invalid fields!' });
  });

  it('❌ should return error when user does not exist', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    const result = await login({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ error: 'Email does not exist!' });
  });

  it('❌ should return error when user has no hashed password', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      hashedPassword: null,
    } as any);
    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ error: 'Email does not exist!' });
  });

  it('✅ should send verification email for unverified user', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      emailVerified: null,
    } as any);
    mockGenerateVerificationToken.mockResolvedValue({
      email: 'test@example.com',
      token: 'verify-token',
    } as any);

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ success: 'Confirmation email sent!' });
    expect(mockGenerateVerificationToken).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalled();
  });

  it('✅ should not call signIn if email not verified', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      emailVerified: null,
    } as any);
    mockGenerateVerificationToken.mockResolvedValue({
      email: 'test@example.com',
      token: 'verify-token',
    } as any);

    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('✅ should send 2FA code when 2FA enabled', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGenerateTwoFactorToken.mockResolvedValue({
      email: 'test@example.com',
      token: '123456',
    } as any);

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ twoFactor: true });
    expect(mockGenerateTwoFactorToken).toHaveBeenCalled();
    expect(mockSendTwoFactorEmail).toHaveBeenCalled();
  });

  it('✅ should not call signIn if 2FA needed', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGenerateTwoFactorToken.mockResolvedValue({
      email: 'test@example.com',
      token: '123456',
    } as any);

    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('❌ should return error for invalid 2FA code', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGetTwoFactorTokenByEmail.mockResolvedValue({
      id: 'token-1',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(Date.now() + 3600000),
    } as any);

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
      code: 'wrong-code',
    });
    expect(result).toEqual({ error: 'Invalid code!' });
  });

  it('❌ should return error for expired 2FA code', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGetTwoFactorTokenByEmail.mockResolvedValue({
      id: 'token-1',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(Date.now() - 1000),
    } as any);

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
      code: '123456',
    });
    expect(result).toEqual({ error: 'Code has expired!' });
  });

  it('✅ should verify 2FA code with correct code', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGetTwoFactorTokenByEmail.mockResolvedValue({
      id: 'token-1',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(Date.now() + 3600000),
    } as any);
    mockGetTwoFactorConfirmationByUserId.mockResolvedValue(null);
    const dbMock = db as jest.Mocked<typeof db>;
    (dbMock.twoFactorToken as any) = {
      delete: jest.fn().mockResolvedValue({}),
    };
    (dbMock.twoFactorConfirmation as any) = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await login({
      email: 'test@example.com',
      password: 'password123',
      code: '123456',
    });
    expect(result).toBeUndefined();
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('✅ should delete old 2FA confirmation before creating new', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGetTwoFactorTokenByEmail.mockResolvedValue({
      id: 'token-1',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(Date.now() + 3600000),
    } as any);
    const existingConfirmation = { id: 'confirm-1', userId: 'user-1' };
    mockGetTwoFactorConfirmationByUserId.mockResolvedValue(existingConfirmation as any);
    const dbMock = db as jest.Mocked<typeof db>;
    (dbMock.twoFactorToken as any) = {
      delete: jest.fn().mockResolvedValue({}),
    };
    (dbMock.twoFactorConfirmation as any) = {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    };

    await login({
      email: 'test@example.com',
      password: 'password123',
      code: '123456',
    });
    expect(dbMock.twoFactorConfirmation.delete).toHaveBeenCalledWith({
      where: { id: existingConfirmation.id },
    });
  });

  it('✅ should log successful login', async () => {
    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'login_success',
      { email: 'test@example.com' },
      'info'
    );
  });

  it('✅ should log invalid fields error', async () => {
    await login({
      email: 'invalid',
      password: 'pass',
    });
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'login_invalid_fields',
      expect.any(Object),
      'error'
    );
  });

  it('✅ should log non-existent email', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'login_email_not_exist',
      { email: 'test@example.com' },
      'error'
    );
  });

  it('✅ should log verification email sent', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      emailVerified: null,
    } as any);
    mockGenerateVerificationToken.mockResolvedValue({
      email: 'test@example.com',
      token: 'verify-token',
    } as any);

    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'login_confirmation_sent',
      { email: 'test@example.com' },
      'info'
    );
  });

  it('✅ should log 2FA code sent', async () => {
    mockGetUserByEmail.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    } as any);
    mockGenerateTwoFactorToken.mockResolvedValue({
      email: 'test@example.com',
      token: '123456',
    } as any);

    await login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'login_two_factor_sent',
      { email: 'test@example.com' },
      'info'
    );
  });
});
