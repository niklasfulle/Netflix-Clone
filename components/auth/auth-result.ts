import type { AuthResultCode } from '@/lib/authentication/contracts';
import type { TranslationKey } from '@/lib/i18n/translations';

const messageKeys: Partial<Record<AuthResultCode, TranslationKey>> = {
  invalid_fields: 'Invalid fields!',
  invalid_credentials: 'Invalid credentials!',
  invalid_code: 'Invalid code!',
  invalid_token: 'Invalid or missing token!',
  code_expired: 'Code has expired!',
  token_expired: 'Token has expired!',
  email_in_use: 'Email already in use!',
  delivery_failed: 'Email delivery failed. Please try again.',
  auth_failed: 'Something went wrong!',
  rate_limited: 'Too many attempts. Please try again later.',
  verification_sent: 'Confirmation email sent!',
  password_reset_sent: 'Reset email sent!',
  password_updated: 'New password set!',
  email_verified: 'Email verified!',
};

export const getAuthResultMessageKey = (code: AuthResultCode) => messageKeys[code];
