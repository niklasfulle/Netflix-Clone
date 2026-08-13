/** @jest-environment node */

import { privacySafeAuthenticationContext } from '@/lib/authentication/privacy';

describe('authentication audit privacy', () => {
  it('replaces identities with a stable keyed hash and removes credentials', () => {
    const first = privacySafeAuthenticationContext({
      identity: 'Viewer@Example.com',
      password: 'plain-password',
      token: 'raw-token',
      code: '123456',
      scope: 'login',
    }, 'audit-secret');
    const second = privacySafeAuthenticationContext({
      identity: 'viewer@example.com',
    }, 'audit-secret');

    expect(first).toMatchObject({ scope: 'login', identityHash: second.identityHash });
    expect(first.identityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(first)).not.toContain('viewer@example.com');
    expect(first).not.toHaveProperty('password');
    expect(first).not.toHaveProperty('token');
    expect(first).not.toHaveProperty('code');
  });

  it('preserves already pseudonymous throttle metadata', () => {
    expect(privacySafeAuthenticationContext({
      keyHash: 'rate-limit-hash',
      retryAfterSeconds: 120,
    }, 'audit-secret')).toEqual({
      keyHash: 'rate-limit-hash',
      retryAfterSeconds: 120,
    });
  });
});
