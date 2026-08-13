export function normalizeAuthEmail(email: string): string {
  return email.trim().toLocaleLowerCase('en');
}

export type AuthResult =
  | {
      status: 'success';
      code:
        | 'signed_in'
        | 'verification_sent'
        | 'password_reset_sent'
        | 'password_updated'
        | 'email_verified';
    }
  | {
      status: 'rejected';
      code:
        | 'invalid_fields'
        | 'invalid_credentials'
        | 'invalid_code'
        | 'invalid_token'
        | 'code_expired'
        | 'token_expired'
        | 'email_in_use'
        | 'delivery_failed'
        | 'auth_failed';
    }
  | { status: 'retry'; code: 'rate_limited'; retryAfterSeconds: number }
  | {
      status: 'challenge';
      code: 'two_factor_required';
      challenge: 'totp';
      canUseEmailFallback: true;
    }
  | {
      status: 'challenge';
      code: 'two_factor_required';
      challenge: 'email_otp';
      maskedDestination: string;
      expiresInSeconds: number;
      resendAfterSeconds: number;
    };

export type AuthResultCode = AuthResult['code'];
