/** @jest-environment node */

export {};

const mockHeaders = jest.fn();
const mockResolveClientAddress = jest.fn();
const mockCreateSessionSecurity = jest.fn();

jest.mock('next/headers', () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock('@/data/session-security', () => ({
  sessionSecurityRepository: { kind: 'session-repository' },
}));

jest.mock('@/lib/authentication/throttle', () => ({
  resolveClientAddress: (...args: unknown[]) => mockResolveClientAddress(...args),
}));

jest.mock('@/lib/authentication/session-security', () => ({
  createSessionSecurity: (...args: unknown[]) => mockCreateSessionSecurity(...args),
}));

describe('session security runtime adapter', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnvironment,
      NODE_ENV: 'test',
      AUTH_SECRET: 'unit-test-session-secret',
    };
    delete process.env.AUTH_TRUSTED_PROXY_HOPS;
    mockCreateSessionSecurity.mockReturnValue({ kind: 'session-security-service' });
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('creates a request context from the trusted client address and user agent', async () => {
    process.env.AUTH_TRUSTED_PROXY_HOPS = '1';
    mockResolveClientAddress.mockReturnValue('198.51.100.4');
    const { securityContextFromHeaders } = await import('@/lib/session-security');
    const requestHeaders = new Headers({ 'user-agent': 'Example Browser' });

    expect(securityContextFromHeaders(requestHeaders)).toEqual({
      address: '198.51.100.4',
      userAgent: 'Example Browser',
    });
    expect(mockResolveClientAddress).toHaveBeenCalledWith(requestHeaders, 1);
  });

  it('uses safe proxy defaults and omits absent user agents', async () => {
    process.env.AUTH_TRUSTED_PROXY_HOPS = '-1';
    mockResolveClientAddress.mockReturnValue('unknown');
    const { securityContextFromHeaders } = await import('@/lib/session-security');
    const requestHeaders = new Headers();

    expect(securityContextFromHeaders(requestHeaders)).toEqual({
      address: 'unknown',
      userAgent: undefined,
    });
    expect(mockResolveClientAddress).toHaveBeenCalledWith(requestHeaders, 0);
  });

  it('resolves the current request context and tolerates calls outside a request', async () => {
    const requestHeaders = new Headers({ 'user-agent': 'Current Browser' });
    mockHeaders.mockResolvedValueOnce(requestHeaders).mockRejectedValueOnce(new Error('no request'));
    mockResolveClientAddress.mockReturnValue('203.0.113.7');
    const { currentSecurityContext } = await import('@/lib/session-security');

    await expect(currentSecurityContext()).resolves.toEqual({
      address: '203.0.113.7',
      userAgent: 'Current Browser',
    });
    await expect(currentSecurityContext()).resolves.toBeUndefined();
  });

  it('constructs session security with a deterministic privacy-safe address hash', async () => {
    const { sessionSecurity } = await import('@/lib/session-security');
    const dependencies = mockCreateSessionSecurity.mock.calls[0][0];

    expect(sessionSecurity).toEqual({ kind: 'session-security-service' });
    expect(dependencies.repository).toEqual({ kind: 'session-repository' });
    expect(dependencies.hashAddress('198.51.100.4')).toMatch(/^[a-f0-9]{64}$/);
    expect(dependencies.hashAddress('198.51.100.4')).toBe(
      dependencies.hashAddress('198.51.100.4'),
    );
    expect(dependencies.createId()).toMatch(/^[0-9a-f-]{36}$/);
    expect(dependencies.now()).toBeInstanceOf(Date);
  });

  it('allows production builds to import the adapter but rejects privacy hashing without a secret', async () => {
    process.env = { ...process.env, NODE_ENV: 'production' };
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    await expect(import('@/lib/session-security')).resolves.toBeDefined();
    const dependencies = mockCreateSessionSecurity.mock.calls[0][0];
    expect(() => dependencies.hashAddress('198.51.100.4')).toThrow(
      'AUTH_SECRET is required for privacy-safe session security',
    );
  });
});
