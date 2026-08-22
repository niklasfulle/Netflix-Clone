import { createHmac } from 'node:crypto';

export type AuthThrottleScope =
  | 'login'
  | 'register'
  | 'password-reset'
  | 'verification-resend'
  | 'two-factor'
  | 'two-factor-send'
  | 'qr-create'
  | 'qr-approve'
  | 'qr-poll';

export type RateLimitSubject = {
  scope: AuthThrottleScope;
  subjectType: 'account' | 'ip';
  subjectHash: string;
};

type ConsumeRateLimitInput = RateLimitSubject & {
  limit: number;
  windowMs: number;
  now: Date;
};

type StoredRateLimit = {
  attempts: number;
  resetAt: Date;
};

export interface AuthRateLimitRepository {
  consume(inputs: readonly ConsumeRateLimitInput[]): Promise<readonly StoredRateLimit[]>;
  reset(subjects: readonly RateLimitSubject[]): Promise<void>;
}

type ThrottleSettings = Partial<Record<AuthThrottleScope, {
  limit: number;
  ipLimit?: number;
  windowMs: number;
}>>;

type AuthenticationThrottleDependencies = {
  repository: AuthRateLimitRepository;
  clientAddress(): Promise<string>;
  secret: string;
  settings: ThrottleSettings;
  now?: () => Date;
};

export function hashAuthenticationSubject(value: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(value.trim().toLocaleLowerCase('en'))
    .digest('hex');
}

export function resolveClientAddress(
  requestHeaders: Pick<Headers, 'get'>,
  trustedProxyHops: number,
): string {
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1) {
    return 'untrusted-proxy';
  }

  const forwardedAddresses = requestHeaders.get('x-forwarded-for')
    ?.split(',')
    .map((address) => address.trim())
    .filter(Boolean)
    .slice(-20) ?? [];
  if (forwardedAddresses.length > 0) {
    if (forwardedAddresses.length < trustedProxyHops) return 'unknown';
    const addressIndex = forwardedAddresses.length - trustedProxyHops;
    return forwardedAddresses[addressIndex] ?? 'unknown';
  }
  return requestHeaders.get('x-real-ip')?.trim() || 'unknown';
}

export function createAuthenticationThrottle({
  repository,
  clientAddress,
  secret,
  settings,
  now = () => new Date(),
}: AuthenticationThrottleDependencies) {
  const subject = (scope: AuthThrottleScope, subjectType: 'account' | 'ip', value: string) => ({
    scope,
    subjectType,
    subjectHash: hashAuthenticationSubject(value || 'unknown', secret),
  });

  return {
    async consume(scope: AuthThrottleScope, identity: string) {
      const timestamp = now();
      const configuration = settings[scope];
      if (!configuration) {
        throw new Error(`Missing authentication throttle configuration for ${scope}`);
      }
      const accountSubject = subject(scope, 'account', identity);
      const ipSubject = subject(scope, 'ip', await clientAddress());
      const [accountLimit, ipLimit] = await repository.consume([
        {
          ...accountSubject,
          limit: configuration.limit,
          windowMs: configuration.windowMs,
          now: timestamp,
        },
        {
          ...ipSubject,
          limit: configuration.ipLimit ?? configuration.limit,
          windowMs: configuration.windowMs,
          now: timestamp,
        },
      ]);
      if (!accountLimit || !ipLimit) {
        throw new Error('Authentication rate-limit repository returned an incomplete decision');
      }
      const accountAllowed = accountLimit.attempts <= configuration.limit;
      const ipAllowed = ipLimit.attempts <= (configuration.ipLimit ?? configuration.limit);
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((Math.max(accountLimit.resetAt.getTime(), ipLimit.resetAt.getTime())
          - timestamp.getTime()) / 1_000),
      );

      return {
        allowed: accountAllowed && ipAllowed,
        retryAfterSeconds,
        keyHash: accountSubject.subjectHash,
      };
    },

    async release(scope: AuthThrottleScope, identity: string) {
      await repository.reset([subject(scope, 'account', identity)]);
    },
  };
}
