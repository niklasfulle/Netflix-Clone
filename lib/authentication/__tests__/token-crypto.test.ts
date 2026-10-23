import { hashOneTimeToken } from '../token-crypto';

describe('one-time token hashing', () => {
  it('fails closed in production without an authentication secret', () => {
    const environment = jest.replaceProperty(process, 'env', { NODE_ENV: 'production' });
    try { expect(() => hashOneTimeToken('verification', 'test-token')).toThrow('AUTH_SECRET is required for authentication token hashing'); }
    finally { environment.restore(); }
  });

  it('supports local fallback hashing and the legacy secret setting', () => {
    const environment = jest.replaceProperty(process, 'env', { NODE_ENV: 'development' });
    try {
      const localDigest = hashOneTimeToken('verification', 'test-token');
      expect(localDigest).toMatch(/^[a-f0-9]{64}$/);
      process.env.NEXTAUTH_SECRET = 'legacy-test-hashing-key';
      expect(hashOneTimeToken('verification', 'test-token')).not.toBe(localDigest);
    } finally { environment.restore(); }
  });
  it('produces a deterministic purpose- and secret-bound HMAC digest', () => {
    const verificationHash = hashOneTimeToken('verification', 'sample-token', 'secret-a');
    expect(verificationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOneTimeToken('verification', 'sample-token', 'secret-a'))
      .toBe(verificationHash);
    expect(hashOneTimeToken('password-reset', 'sample-token', 'secret-a'))
      .not.toBe(verificationHash);
    expect(hashOneTimeToken('verification', 'sample-token', 'secret-b'))
      .not.toBe(verificationHash);
  });
});
