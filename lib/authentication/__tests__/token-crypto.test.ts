import { hashOneTimeToken } from '../token-crypto';

describe('one-time token hashing', () => {
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
