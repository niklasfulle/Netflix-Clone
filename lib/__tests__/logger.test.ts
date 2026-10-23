/** @jest-environment node */

export {};

const mockWrite = jest.fn();

jest.mock('@/lib/log-store', () => {
  const actual = jest.requireActual('@/lib/log-store');
  return {
    ...actual,
    backendLogStore: { write: (...args: unknown[]) => mockWrite(...args) },
  };
});

describe('backend action logger', () => {
  it('handles events with no operational details without adding undefined fields', async () => {
    const { logBackendAction } = await import('@/lib/logger');
    logBackendAction('service.ready', {}, 'warn');
    expect(mockWrite).toHaveBeenCalledWith({ timestamp: expect.any(String), level: 'warn', action: 'service.ready' });
  });

  it('preserves allow-listed actor and throttle references while dropping unrelated fields', async () => {
    const { logBackendAction } = await import('@/lib/logger');
    logBackendAction('authentication.reference', { userEmail: 'viewer@example.test', email: 'contact@example.test', identityHash: 'identity-reference', keyHash: 'bucket-reference', ignored: 'not-logged', values: {} });
    expect(mockWrite).toHaveBeenCalledWith({ timestamp: expect.any(String), level: 'info', action: 'authentication.reference', userEmail: 'viewer@example.test', email: 'contact@example.test', identityHash: 'identity-reference', keyHash: 'bucket-reference' });
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps routine events restricted to allow-listed operational fields', async () => {
    const { logBackendAction } = await import('@/lib/logger');

    logBackendAction('catalog.scan', {
      userId: 'admin-123',
      role: 'ADMIN',
      movieId: 'movie-42',
      password: 'must-not-appear',
      values: { movieName: 'Example', internalPath: '/private/movie.mp4' },
    });

    expect(mockWrite).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      level: 'info',
      action: 'catalog.scan',
      userId: 'admin-123',
      role: 'ADMIN',
      movieId: 'movie-42',
      movieName: 'Example',
    });
  });

  it('preserves sanitized diagnostic context for error events', async () => {
    const { logBackendAction } = await import('@/lib/logger');

    logBackendAction('catalog.scan.failed', {
      error: new Error('scanner unavailable'),
      identityHash: 'identity-hash',
    }, 'error');

    expect(mockWrite).toHaveBeenCalledWith(expect.objectContaining({
      level: 'error',
      action: 'catalog.scan.failed',
      identityHash: 'identity-hash',
      error: expect.any(Object),
    }));
  });
});
