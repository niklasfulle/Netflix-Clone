jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendResetPasswordEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generatePasswordResetToken: jest.fn(),
}));

jest.mock('@/schemas', () => ({
  ResetPasswordSchema: {
    safeParse: jest.fn(),
  },
}));

import { reset } from '../reset-password';
import { logBackendAction } from '@/lib/logger';
import { getUserByEmail } from '@/data/user';
import { sendResetPasswordEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';
import { ResetPasswordSchema } from '@/schemas';

describe('reset action - Password Reset Request', () => {
  const mockLogBackendAction = logBackendAction as jest.MockedFunction<typeof logBackendAction>;
  const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
  const mockSendResetPasswordEmail = sendResetPasswordEmail as jest.MockedFunction<typeof sendResetPasswordEmail>;
  const mockGeneratePasswordResetToken = generatePasswordResetToken as jest.MockedFunction<typeof generatePasswordResetToken>;
  const mockResetPasswordSchema = ResetPasswordSchema as any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const mockToken = {
    email: 'test@example.com',
    token: 'reset-token-123',
    expires: new Date(Date.now() + 3600000),
  };

  const validEmail = { email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPasswordSchema.safeParse.mockReturnValue({
      success: true,
      data: validEmail,
    });
    mockGetUserByEmail.mockResolvedValue(mockUser as any);
    mockGeneratePasswordResetToken.mockResolvedValue(mockToken as any);
    mockSendResetPasswordEmail.mockResolvedValue(undefined);
  });

  describe('Valid Reset Request', () => {
    it('✅ should validate email with valid input', async () => {
      await reset(validEmail);
      expect(mockResetPasswordSchema.safeParse).toHaveBeenCalledWith(validEmail);
    });

    it('✅ should check if user exists with valid email', async () => {
      await reset(validEmail);
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('✅ should generate password reset token', async () => {
      await reset(validEmail);
      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('test@example.com');
    });

    it('✅ should send reset password email', async () => {
      await reset(validEmail);
      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
        mockToken.email,
        mockToken.token
      );
    });

    it('✅ should return success message', async () => {
      const result = await reset(validEmail);
      expect(result).toEqual({ success: 'Reset email sent!' });
    });

    it('✅ should log successful reset request', async () => {
      await reset(validEmail);
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_success',
        { email: 'test@example.com' },
        'info'
      );
    });
  });

  describe('Email Validation', () => {
    it('❌ should return error when email validation fails', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset({ email: 'invalid-email' });
      expect(result).toEqual({ error: 'Invalid email!' });
    });

    it('❌ should log error when email validation fails', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset({ email: 'invalid-email' });
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_invalid_email',
        { values: { email: 'invalid-email' } },
        'error'
      );
    });

    it('❌ should not check user if validation fails', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset({ email: 'invalid-email' });
      expect(mockGetUserByEmail).not.toHaveBeenCalled();
    });

    it('❌ should not generate token if validation fails', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset({ email: 'invalid-email' });
      expect(mockGeneratePasswordResetToken).not.toHaveBeenCalled();
    });

    it('❌ should not send email if validation fails', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset({ email: 'invalid-email' });
      expect(mockSendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('❌ should handle empty email', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset({ email: '' });
      expect(result).toEqual({ error: 'Invalid email!' });
    });

    it('❌ should handle email with invalid format', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset({ email: 'not-an-email' });
      expect(result).toEqual({ error: 'Invalid email!' });
    });
  });

  describe('User Existence Check', () => {
    it('❌ should return error when user does not exist', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await reset(validEmail);
      expect(result).toEqual({ error: 'Email does not exist!' });
    });

    it('❌ should log error when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);
      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_email_not_exist',
        { email: 'test@example.com' },
        'error'
      );
    });

    it('❌ should not generate token if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);
      expect(mockGeneratePasswordResetToken).not.toHaveBeenCalled();
    });

    it('❌ should not send email if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);
      expect(mockSendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('✅ should check user by exact email', async () => {
      const email = 'specific@example.com';
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email },
      });

      await reset({ email });

      expect(mockGetUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('Token Generation and Email Sending', () => {
    it('✅ should generate token with user email', async () => {
      await reset(validEmail);

      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('test@example.com');
    });

    it('✅ should send email with correct parameters', async () => {
      await reset(validEmail);

      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
        mockToken.email,
        mockToken.token
      );
    });

    it('✅ should use generated token email', async () => {
      const customTokenEmail = 'custom@example.com';
      mockGeneratePasswordResetToken.mockResolvedValue({
        ...mockToken,
        email: customTokenEmail,
      } as any);

      await reset(validEmail);

      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
        customTokenEmail,
        mockToken.token
      );
    });

    it('✅ should use generated token string', async () => {
      const customToken = 'custom-token-456';
      mockGeneratePasswordResetToken.mockResolvedValue({
        ...mockToken,
        token: customToken,
      } as any);

      await reset(validEmail);

      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
        mockToken.email,
        customToken
      );
    });
  });

  describe('Logging', () => {
    it('✅ should log with correct email on validation error', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset({ email: 'test@invalid.com' });

      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_invalid_email',
        { values: { email: 'test@invalid.com' } },
        'error'
      );
    });

    it('✅ should log with correct email when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);

      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_email_not_exist',
        { email: 'test@example.com' },
        'error'
      );
    });

    it('✅ should log success with correct email', async () => {
      await reset(validEmail);

      expect(mockLogBackendAction).toHaveBeenCalledWith(
        'resetPassword_success',
        { email: 'test@example.com' },
        'info'
      );
    });

    it('✅ should use error level for validation error', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset(validEmail);

      const call = (mockLogBackendAction as jest.Mock).mock.calls[0];
      expect(call[2]).toBe('error');
    });

    it('✅ should use error level for user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);

      const call = (mockLogBackendAction as jest.Mock).mock.calls[0];
      expect(call[2]).toBe('error');
    });

    it('✅ should use info level for success', async () => {
      await reset(validEmail);

      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const successCall = calls.find((call: any[]) => call[0] === 'resetPassword_success');
      expect(successCall[2]).toBe('info');
    });
  });

  describe('Return Values', () => {
    it('✅ should return error object with validation message', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset(validEmail);
      expect(result).toEqual({ error: 'Invalid email!' });
    });

    it('✅ should return error object with not exist message', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await reset(validEmail);
      expect(result).toEqual({ error: 'Email does not exist!' });
    });

    it('✅ should return success object', async () => {
      const result = await reset(validEmail);
      expect(result).toEqual({ success: 'Reset email sent!' });
    });

    it('✅ should return success message after email sent', async () => {
      const result = await reset(validEmail);
      expect(result.success).toBe('Reset email sent!');
    });

    it('❌ should not return success on validation error', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset(validEmail);
      expect(result).not.toHaveProperty('success');
    });

    it('❌ should not return success on user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await reset(validEmail);
      expect(result).not.toHaveProperty('success');
    });
  });

  describe('Integration Scenarios', () => {
    it('✅ should complete full reset flow', async () => {
      const result = await reset(validEmail);

      expect(mockResetPasswordSchema.safeParse).toHaveBeenCalled();
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('test@example.com');
      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
        mockToken.email,
        mockToken.token
      );
      expect(result).toEqual({ success: 'Reset email sent!' });
    });

    it('✅ should stop at validation if email invalid', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset(validEmail);

      expect(mockGetUserByEmail).not.toHaveBeenCalled();
      expect(mockGeneratePasswordResetToken).not.toHaveBeenCalled();
      expect(mockSendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('✅ should stop at user check if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      await reset(validEmail);

      expect(mockGeneratePasswordResetToken).not.toHaveBeenCalled();
      expect(mockSendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('✅ should log success only after all operations', async () => {
      await reset(validEmail);

      const calls = (mockLogBackendAction as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('resetPassword_success');
    });

    it('✅ should handle multiple different emails', async () => {
      mockResetPasswordSchema.safeParse
        .mockReturnValueOnce({
          success: true,
          data: { email: 'first@example.com' },
        })
        .mockReturnValueOnce({
          success: true,
          data: { email: 'second@example.com' },
        });

      await reset({ email: 'first@example.com' });
      await reset({ email: 'second@example.com' });

      expect(mockGetUserByEmail).toHaveBeenNthCalledWith(1, 'first@example.com');
      expect(mockGetUserByEmail).toHaveBeenNthCalledWith(2, 'second@example.com');
    });
  });

  describe('Schema Validation', () => {
    it('✅ should pass values to schema validation', async () => {
      const testValues = { email: 'test@example.com' };
      await reset(testValues);

      expect(mockResetPasswordSchema.safeParse).toHaveBeenCalledWith(testValues);
    });

    it('✅ should extract email from validated data', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'extracted@example.com' },
      });

      await reset({ email: 'original@example.com' });

      expect(mockGetUserByEmail).toHaveBeenCalledWith('extracted@example.com');
    });

    it('❌ should handle validation with missing data', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      const result = await reset({} as any);
      expect(result).toEqual({ error: 'Invalid email!' });
    });
  });

  describe('Email Sending Scenarios', () => {
    it('✅ should send email to reset token email address', async () => {
      const tokenEmail = 'token@example.com';
      mockGeneratePasswordResetToken.mockResolvedValue({
        ...mockToken,
        email: tokenEmail,
      } as any);

      await reset(validEmail);

      const emailCall = (mockSendResetPasswordEmail as jest.Mock).mock.calls[0];
      expect(emailCall[0]).toBe(tokenEmail);
    });

    it('✅ should include token in email', async () => {
      const tokenString = 'unique-token-789';
      mockGeneratePasswordResetToken.mockResolvedValue({
        ...mockToken,
        token: tokenString,
      } as any);

      await reset(validEmail);

      const emailCall = (mockSendResetPasswordEmail as jest.Mock).mock.calls[0];
      expect(emailCall[1]).toBe(tokenString);
    });

    it('✅ should call send email once per request', async () => {
      await reset(validEmail);

      expect(mockSendResetPasswordEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('❌ should validate before checking user', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: false,
      });

      await reset(validEmail);

      expect(mockGetUserByEmail).not.toHaveBeenCalled();
    });

    it('❌ should handle null user gracefully', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await reset(validEmail);

      expect(result).toEqual({ error: 'Email does not exist!' });
      expect(result).not.toHaveProperty('success');
    });

    it('✅ should continue to token generation if user exists', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser as any);

      await reset(validEmail);

      expect(mockGeneratePasswordResetToken).toHaveBeenCalled();
    });
  });

  describe('Case Sensitivity', () => {
    it('✅ should pass email as provided to getUserByEmail', async () => {
      const email = 'Test@Example.COM';
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email },
      });

      await reset({ email });

      expect(mockGetUserByEmail).toHaveBeenCalledWith(email);
    });

    it('✅ should pass email as provided to generatePasswordResetToken', async () => {
      const email = 'Test@Example.COM';
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email },
      });

      await reset({ email });

      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith(email);
    });
  });

  describe('Different Email Addresses', () => {
    it('✅ should handle gmail addresses', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'user@gmail.com' },
      });

      await reset({ email: 'user@gmail.com' });

      expect(mockGetUserByEmail).toHaveBeenCalledWith('user@gmail.com');
    });

    it('✅ should handle business email addresses', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'user@company.co.uk' },
      });

      await reset({ email: 'user@company.co.uk' });

      expect(mockGetUserByEmail).toHaveBeenCalledWith('user@company.co.uk');
    });

    it('✅ should handle emails with subdomains', async () => {
      mockResetPasswordSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'user@sub.example.com' },
      });

      await reset({ email: 'user@sub.example.com' });

      expect(mockGetUserByEmail).toHaveBeenCalledWith('user@sub.example.com');
    });
  });
});
