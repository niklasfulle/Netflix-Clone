import { hashAuthenticationSubject } from './throttle';

const CREDENTIAL_KEY = /(password|passphrase|token|authorization|cookie|secret|credential|otp|code|confirm)/i;
const IDENTITY_KEY = /^(identity|email|userEmail)$/i;

export function privacySafeAuthenticationContext(
  context: Record<string, unknown>,
  secret: string,
): Record<string, unknown> {
  const safeContext: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (CREDENTIAL_KEY.test(key)) continue;
    if (IDENTITY_KEY.test(key)) {
      if (typeof value === 'string') {
        safeContext.identityHash = hashAuthenticationSubject(value, secret);
      }
      continue;
    }
    safeContext[key] = value;
  }
  return safeContext;
}
