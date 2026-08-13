/** @jest-environment node */

import {
  createAuthenticationThrottle,
  resolveClientAddress,
  type AuthRateLimitRepository,
  type RateLimitSubject,
} from '@/lib/authentication/throttle';

type StoredLimit = { attempts: number; resetAt: Date };

function createPersistentFakeRepository() {
  const records = new Map<string, StoredLimit>();
  const resetSubjects: RateLimitSubject[] = [];
  const repository: AuthRateLimitRepository = {
    consume: async (input) => {
      const key = `${input.scope}:${input.subjectType}:${input.subjectHash}`;
      const existing = records.get(key);
      const next = !existing || existing.resetAt <= input.now
        ? { attempts: 1, resetAt: new Date(input.now.getTime() + input.windowMs) }
        : { attempts: Math.min(existing.attempts + 1, input.limit + 1), resetAt: existing.resetAt };
      records.set(key, next);
      return next;
    },
    reset: async (subject) => {
      resetSubjects.push(subject);
      records.delete(`${subject.scope}:${subject.subjectType}:${subject.subjectHash}`);
    },
  };
  return { repository, records, resetSubjects };
}

describe('authentication throttle', () => {
  const settings = {
    login: { limit: 2, windowMs: 10_000 },
    register: { limit: 2, windowMs: 10_000 },
    'password-reset': { limit: 2, windowMs: 10_000 },
    'verification-resend': { limit: 2, windowMs: 10_000 },
    'two-factor': { limit: 2, windowMs: 10_000 },
    'two-factor-send': { limit: 1, windowMs: 60_000 },
  } as const;

  it('shares limits across throttle instances and survives an instance restart', async () => {
    const { repository } = createPersistentFakeRepository();
    const dependencies = {
      repository,
      clientAddress: async () => '192.0.2.10',
      secret: 'stable-test-secret',
      settings,
      now: () => new Date('2026-08-09T20:00:00.000Z'),
    };

    const firstInstance = createAuthenticationThrottle(dependencies);
    const restartedInstance = createAuthenticationThrottle(dependencies);

    await expect(firstInstance.consume('login', 'Viewer@Example.com')).resolves
      .toMatchObject({ allowed: true });
    await expect(restartedInstance.consume('login', 'viewer@example.com')).resolves
      .toMatchObject({ allowed: true });
    await expect(restartedInstance.consume('login', 'viewer@example.com')).resolves
      .toMatchObject({ allowed: false, retryAfterSeconds: 10 });
  });

  it('resets only the account budget after a successful login', async () => {
    const { repository, resetSubjects } = createPersistentFakeRepository();
    const throttle = createAuthenticationThrottle({
      repository,
      clientAddress: async () => '192.0.2.10',
      secret: 'stable-test-secret',
      settings,
      now: () => new Date('2026-08-09T20:00:00.000Z'),
    });

    await throttle.consume('login', 'viewer@example.com');
    await throttle.release('login', 'viewer@example.com');

    expect(resetSubjects).toHaveLength(1);
    expect(resetSubjects[0]).toMatchObject({ scope: 'login', subjectType: 'account' });
  });

  it('keeps a separate shared IP budget after account success', async () => {
    const { repository } = createPersistentFakeRepository();
    const throttle = createAuthenticationThrottle({
      repository,
      clientAddress: async () => '192.0.2.10',
      secret: 'stable-test-secret',
      settings: { ...settings, login: { limit: 1, ipLimit: 2, windowMs: 10_000 } },
      now: () => new Date('2026-08-09T20:00:00.000Z'),
    });

    expect((await throttle.consume('login', 'first@example.com')).allowed).toBe(true);
    await throttle.release('login', 'first@example.com');
    expect((await throttle.consume('login', 'second@example.com')).allowed).toBe(true);
    expect((await throttle.consume('login', 'third@example.com')).allowed).toBe(false);
  });

  it('opens a fresh persisted window after the stored expiry', async () => {
    const { repository } = createPersistentFakeRepository();
    let now = new Date('2026-08-09T20:00:00.000Z');
    const throttle = createAuthenticationThrottle({
      repository,
      clientAddress: async () => '192.0.2.10',
      secret: 'stable-test-secret',
      settings: { ...settings, login: { limit: 1, windowMs: 10_000 } },
      now: () => now,
    });

    expect((await throttle.consume('login', 'viewer@example.com')).allowed).toBe(true);
    expect((await throttle.consume('login', 'viewer@example.com')).allowed).toBe(false);
    now = new Date('2026-08-09T20:00:10.001Z');
    expect((await throttle.consume('login', 'viewer@example.com')).allowed).toBe(true);
  });

  it('allows no more than the configured limit during concurrent attempts', async () => {
    const { repository } = createPersistentFakeRepository();
    const throttle = createAuthenticationThrottle({
      repository,
      clientAddress: async () => '192.0.2.10',
      secret: 'stable-test-secret',
      settings,
      now: () => new Date('2026-08-09T20:00:00.000Z'),
    });

    const attempts = await Promise.all(Array.from({ length: 4 }, () => (
      throttle.consume('login', 'viewer@example.com')
    )));
    expect(attempts.filter(({ allowed }) => allowed)).toHaveLength(2);
  });
});

describe('trusted proxy address policy', () => {
  const requestHeaders = new Headers({
    'x-forwarded-for': '198.51.100.7, 192.0.2.20',
    'x-real-ip': '203.0.113.8',
  });

  it('ignores forwarding headers unless a proxy hop is explicitly trusted', () => {
    expect(resolveClientAddress(requestHeaders, 0)).toBe('untrusted-proxy');
  });

  it('selects the address before the configured trusted proxy hops', () => {
    expect(resolveClientAddress(requestHeaders, 1)).toBe('192.0.2.20');
    expect(resolveClientAddress(requestHeaders, 2)).toBe('198.51.100.7');
  });

  it('bounds invalid proxy configuration to the safe default', () => {
    expect(resolveClientAddress(requestHeaders, -1)).toBe('untrusted-proxy');
    expect(resolveClientAddress(requestHeaders, Number.NaN)).toBe('untrusted-proxy');
    expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '198.51.100.7' }), 2))
      .toBe('unknown');
  });
});
