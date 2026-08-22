/** @jest-environment node */

export {};

const mockConsume = jest.fn();
const mockRelease = jest.fn();
const mockHeaders = jest.fn();
const mockResolveClientAddress = jest.fn();
const mockCreateAuthenticationThrottle = jest.fn();
const mockCreateRedisAuthRateLimitRepository = jest.fn();
const mockGetRedisRuntime = jest.fn();

jest.mock('next/headers', () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock('@/data/auth-rate-limit', () => ({
  authRateLimitRepository: { kind: 'persistent-repository' },
}));

jest.mock('@/data/redis-auth-rate-limit', () => ({
  createRedisAuthRateLimitRepository: (...args: unknown[]) => (
    mockCreateRedisAuthRateLimitRepository(...args)
  ),
}));

jest.mock('@/lib/redis/runtime', () => ({
  getRedisRuntime: (...args: unknown[]) => mockGetRedisRuntime(...args),
}));

jest.mock('@/lib/authentication/throttle', () => ({
  createAuthenticationThrottle: (...args: unknown[]) => mockCreateAuthenticationThrottle(...args),
  resolveClientAddress: (...args: unknown[]) => mockResolveClientAddress(...args),
}));

describe('authentication throttle runtime adapter', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnvironment,
      NODE_ENV: 'test',
      AUTH_SECRET: 'unit-test-auth-secret',
    };
    delete process.env.ENABLE_AUTH_THROTTLE_IN_TESTS;
    delete process.env.AUTH_TRUSTED_PROXY_HOPS;
    mockCreateAuthenticationThrottle.mockReturnValue({
      consume: mockConsume,
      release: mockRelease,
    });
    mockGetRedisRuntime.mockReturnValue({ kind: 'redis-runtime' });
    mockCreateRedisAuthRateLimitRepository.mockReturnValue({ kind: 'redis-rate-limit-repository' });
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('bypasses persistence in ordinary unit tests', async () => {
    const { consumeAuthAttempt, releaseAuthAttempt } = await import('@/lib/auth-throttle');

    await expect(consumeAuthAttempt('login', 'viewer@example.test')).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
      keyHash: 'test',
    });
    await expect(releaseAuthAttempt('login', 'viewer@example.test')).resolves.toBeUndefined();
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockRelease).not.toHaveBeenCalled();
  });

  it('forwards enabled test traffic to the persistent throttle', async () => {
    process.env.ENABLE_AUTH_THROTTLE_IN_TESTS = 'true';
    mockConsume.mockResolvedValue({ allowed: false, retryAfterSeconds: 60, keyHash: 'hash' });
    mockRelease.mockResolvedValue(undefined);
    const { consumeAuthAttempt, releaseAuthAttempt } = await import('@/lib/auth-throttle');

    await expect(consumeAuthAttempt('register', 'viewer@example.test')).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
      keyHash: 'hash',
    });
    await releaseAuthAttempt('register', 'viewer@example.test');

    expect(mockConsume).toHaveBeenCalledWith('register', 'viewer@example.test');
    expect(mockRelease).toHaveBeenCalledWith('register', 'viewer@example.test');
  });

  it('builds the persistent adapter with a bounded trusted-proxy address resolver', async () => {
    process.env.ENABLE_AUTH_THROTTLE_IN_TESTS = 'true';
    process.env.AUTH_TRUSTED_PROXY_HOPS = '2';
    const requestHeaders = new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.2' });
    mockHeaders.mockResolvedValue(requestHeaders);
    mockResolveClientAddress.mockReturnValue('198.51.100.1');
    const { consumeAuthAttempt } = await import('@/lib/auth-throttle');
    await consumeAuthAttempt('login', 'viewer@example.test');

    const dependencies = mockCreateAuthenticationThrottle.mock.calls[0][0];
    await expect(dependencies.clientAddress()).resolves.toBe('198.51.100.1');
    expect(mockResolveClientAddress).toHaveBeenCalledWith(requestHeaders, 2);
    expect(dependencies.secret).toBe('unit-test-auth-secret');
    expect(dependencies.settings.login).toEqual({
      limit: 5,
      ipLimit: 50,
      windowMs: 15 * 60_000,
    });
    expect(mockCreateRedisAuthRateLimitRepository).toHaveBeenCalledWith({
      redis: { kind: 'redis-runtime' },
      fallback: { kind: 'persistent-repository' },
    });
    expect(dependencies.repository).toEqual({ kind: 'redis-rate-limit-repository' });
  });

  it('falls back to an unknown address when request headers are unavailable', async () => {
    process.env.ENABLE_AUTH_THROTTLE_IN_TESTS = 'true';
    process.env.AUTH_TRUSTED_PROXY_HOPS = '99';
    mockHeaders.mockRejectedValue(new Error('outside request scope'));
    const { consumeAuthAttempt } = await import('@/lib/auth-throttle');
    await consumeAuthAttempt('login', 'viewer@example.test');

    const dependencies = mockCreateAuthenticationThrottle.mock.calls[0][0];
    await expect(dependencies.clientAddress()).resolves.toBe('unknown');
    expect(mockResolveClientAddress).not.toHaveBeenCalled();
  });

  it('allows production builds to import the adapter but rejects runtime use without a secret', async () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    const adapter = await import('@/lib/auth-throttle');

    expect(mockCreateAuthenticationThrottle).not.toHaveBeenCalled();
    await expect(adapter.consumeAuthAttempt('login', 'viewer@example.test')).rejects.toThrow(
      'AUTH_SECRET is required for persistent authentication throttling',
    );
  });
});
