jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/data/verification-token', () => ({
  getVerificationTokenByToken: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      update: jest.fn(),
    },
    verificationToken: {
      delete: jest.fn(),
    },
  },
}));

import { newVerification } from '../new-verification';
import { logBackendAction } from '@/lib/logger';
import { getUserByEmail } from '@/data/user';
import { getVerificationTokenByToken } from '@/data/verification-token';
import { db } from '@/lib/db';

describe('newVerification action - Token Verification & Email Confirmation', () => {
  const mockLogBackendAction = logBackendAction as jest.MockedFunction<typeof logBackendAction>;
  const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
  const mockGetVerificationTokenByToken = getVerificationTokenByToken as jest.MockedFunction<typeof getVerificationTokenByToken>;

  const mockToken = {
    id: 'token-1',
    email: 'test@example.com',
    token: 'verification-token-123',
    expires: new Date(Date.now() + 3600000),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    emailVerified: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVerificationTokenByToken.mockResolvedValue(mockToken as any);
    mockGetUserByEmail.mockResolvedValue(mockUser as any);
  });

  describe('Valid Verification', () => {
    it('✅ should verify email with valid token', async () => {
      await newVerification('verification-token-123');
      expect(mockGetVerificationTokenByToken).toHaveBeenCalledWith('verification-token-123');
      expect(mockGetUserByEmail).toHaveBeenCalledWith(mockToken.email);
    });

    it('✅ should update user with verified email', async () => {
      const dbMock = db as any;
      (dbMock.user as any) = {
        update: jest.fn().mockResolvedValue({}),
      };

      await newVerification('verification-token-123');
      expect(dbMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerified: expect.any(Date),
          email: mockToken.email,
        },
      });
    });

    it('✅ should delete verification token after success', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      };
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      };

      await newVerification('verification-token-123');
      expect(dbMock.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: mockToken.id },
      });
    });

    it('✅ should return success message', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ succes: 'Email verified!' });
    });

    it('✅ should log successful verification', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_success',
        { email: mockToken.email },
        'info'
      );
    });
  });

  describe('Token Validation', () => {
    it('❌ should return error when token does not exist', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      const result = await newVerification('invalid-token');
      expect(result).toEqual({ error: 'Token does not exist!' });
    });

    it('❌ should log error when token not found', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      await newVerification('invalid-token');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_token_not_exist',
        { token: 'invalid-token' },
        'error'
      );
    });

    it('❌ should not call getUserByEmail if token not found', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      await newVerification('invalid-token');
      expect(mockGetUserByEmail).not.toHaveBeenCalled();
    });

    it('❌ should return error when token has expired', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);

      const result = await newVerification('expired-token');
      expect(result).toEqual({ error: 'Token has expired!' });
    });

    it('❌ should log error when token expired', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);

      await newVerification('expired-token');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_token_expired',
        { token: 'expired-token' },
        'error'
      );
    });

    it('❌ should not call getUserByEmail if token expired', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);

      await newVerification('expired-token');
      expect(mockGetUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    it('❌ should return error when user does not exist', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ error: 'Email dows not exist!' });
    });

    it('❌ should log error when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      await newVerification('verification-token-123');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_email_not_exist',
        { email: mockToken.email },
        'error'
      );
    });

    it('❌ should not update user if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(dbMock.user.update).not.toHaveBeenCalled();
    });

    it('❌ should not delete token if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const dbMock = db as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(dbMock.verificationToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('Database Operations', () => {
    it('✅ should call getUserByEmail with token email', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(mockGetUserByEmail).toHaveBeenCalledWith(mockToken.email);
    });

    it('✅ should update user emailVerified field', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      const updateCall = (dbMock.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.emailVerified).toBeInstanceOf(Date);
    });

    it('✅ should update user email field', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(dbMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerified: expect.any(Date),
          email: mockToken.email,
        },
      });
    });

    it('✅ should delete verification token by id', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(dbMock.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: mockToken.id },
      });
    });

    it('✅ should update user with correct id', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      const updateCall = (dbMock.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where.id).toBe(mockUser.id);
    });
  });

  describe('Logging', () => {
    it('✅ should log with token value when token not found', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      await newVerification('some-token');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_token_not_exist',
        { token: 'some-token' },
        'error'
      );
    });

    it('✅ should log with token value when token expired', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);

      await newVerification('expired-token');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_token_expired',
        { token: 'expired-token' },
        'error'
      );
    });

    it('✅ should log with email when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      await newVerification('verification-token-123');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_email_not_exist',
        { email: mockToken.email },
        'error'
      );
    });

    it('✅ should log success with correct email', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'newVerification_success',
        { email: 'test@example.com' },
        'info'
      );
    });

    it('✅ should use error level for all errors', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      await newVerification('invalid-token');
      
      const call = (mockLogBackendAction as jest.Mock).mock.calls[0];
      expect(call[2]).toBe('error');
    });

    it('✅ should use info level for success', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');
      
      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const successCall = calls.find((call: any[]) => call[0] === 'newVerification_success');
      expect(successCall[2]).toBe('info');
    });
  });

  describe('Return Values', () => {
    it('✅ should return error object with token does not exist message', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      const result = await newVerification('invalid-token');
      expect(result).toEqual({ error: 'Token does not exist!' });
    });

    it('✅ should return error object with token expired message', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);

      const result = await newVerification('expired-token');
      expect(result).toEqual({ error: 'Token has expired!' });
    });

    it('✅ should return error object with email not exist message', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ error: 'Email dows not exist!' });
    });

    it('✅ should return success object on valid verification', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ succes: 'Email verified!' });
    });
  });

  describe('Integration Scenarios', () => {
    it('✅ should handle complete verification flow', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      const result = await newVerification('verification-token-123');

      expect(mockGetVerificationTokenByToken).toHaveBeenCalledWith('verification-token-123');
      expect(mockGetUserByEmail).toHaveBeenCalledWith(mockToken.email);
      expect(dbMock.user.update).toHaveBeenCalled();
      expect(dbMock.verificationToken.delete).toHaveBeenCalled();
      expect(result).toEqual({ succes: 'Email verified!' });
    });

    it('✅ should log success only after all operations complete', async () => {
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');

      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('newVerification_success');
    });

    it('❌ should stop at token check if invalid', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue(null);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('invalid-token');

      expect(mockGetUserByEmail).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    });

    it('❌ should stop at expiry check if expired', async () => {
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(Date.now() - 1000),
      } as any);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('expired-token');

      expect(mockGetUserByEmail).not.toHaveBeenCalled();
      expect(dbMock.user.update).not.toHaveBeenCalled();
    });

    it('❌ should stop at user check if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;

      await newVerification('verification-token-123');

      expect(dbMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Token Expiry Edge Cases', () => {
    it('✅ should accept token expiring exactly now', async () => {
      const now = new Date();
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(now.getTime() + 1), // 1ms in future
      } as any);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ succes: 'Email verified!' });
    });

    it('✅ should accept token expiring at exact moment', async () => {
      const now = new Date();
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: now,
      } as any);
      const dbMock = db as any;
      dbMock.user = {
        update: jest.fn().mockResolvedValue({}),
      } as any;
      dbMock.verificationToken = {
        delete: jest.fn().mockResolvedValue({}),
      } as any;

      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ succes: 'Email verified!' });
    });

    it('❌ should reject token expired 1ms ago', async () => {
      const now = new Date();
      mockGetVerificationTokenByToken.mockResolvedValue({
        ...mockToken,
        expires: new Date(now.getTime() - 1),
      } as any);

      const result = await newVerification('verification-token-123');
      expect(result).toEqual({ error: 'Token has expired!' });
    });
  });
});
