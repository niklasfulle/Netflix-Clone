import crypto from 'node:crypto';

export type OneTimeTokenPurpose = 'verification' | 'password-reset' | 'two-factor';

function authenticationHashSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required for authentication token hashing');
  }
  return secret ?? 'development-auth-token-secret';
}

export function hashOneTimeToken(
  purpose: OneTimeTokenPurpose,
  rawToken: string,
  secret = authenticationHashSecret(),
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${purpose}\0${rawToken}`)
    .digest('hex');
}

export function createOpaqueOneTimeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
