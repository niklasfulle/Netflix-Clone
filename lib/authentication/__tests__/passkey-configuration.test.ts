import { resolvePasskeyConfiguration } from '@/lib/authentication/passkey-configuration';

describe('resolvePasskeyConfiguration', () => {
  const configuration = { AUTH_PASSKEYS_ENABLED: 'true', AUTH_WEBAUTHN_RP_ID: 'example.com', AUTH_WEBAUTHN_RP_NAME: 'Netflix Clone', AUTH_WEBAUTHN_ORIGIN: 'https://login.example.com' };

  it.each(['invalid origin', 'https://name@example.com', 'https://:value@example.com', 'https://example.com/path', 'https://example.com?query=1', 'https://example.com#fragment'])('rejects malformed or noncanonical origins: %s', origin => {
    expect(() => resolvePasskeyConfiguration({ ...configuration, AUTH_WEBAUTHN_ORIGIN: origin })).toThrow('AUTH_WEBAUTHN_ORIGIN must be');
  });

  it('allows subdomains and local HTTP development with complete configuration', () => {
    expect(resolvePasskeyConfiguration(configuration)).toMatchObject({ enabled: true, rpId: 'example.com' });
    expect(resolvePasskeyConfiguration({ ...configuration, AUTH_WEBAUTHN_RP_ID: 'localhost', AUTH_WEBAUTHN_ORIGIN: 'http://localhost:3000' }, 'development')).toMatchObject({ enabled: true, rpId: 'localhost' });
    expect(() => resolvePasskeyConfiguration({ ...configuration, AUTH_WEBAUTHN_ORIGIN: 'http://example.com' }, 'development')).toThrow('must use HTTPS');
  });
  it('keeps passkeys disabled unless the feature is explicitly enabled', () => {
    expect(resolvePasskeyConfiguration({}, 'production')).toEqual({ enabled: false });
    expect(
      resolvePasskeyConfiguration({ AUTH_PASSKEYS_ENABLED: 'false' }, 'production'),
    ).toEqual({ enabled: false });
  });

  it('returns an explicit canonical HTTPS relying-party configuration', () => {
    expect(
      resolvePasskeyConfiguration(
        {
          AUTH_PASSKEYS_ENABLED: 'true',
          AUTH_WEBAUTHN_RP_ID: 'netflix.example.com',
          AUTH_WEBAUTHN_RP_NAME: 'Netflix Clone',
          AUTH_WEBAUTHN_ORIGIN: 'https://netflix.example.com',
        },
        'production',
      ),
    ).toEqual({
      enabled: true,
      rpId: 'netflix.example.com',
      rpName: 'Netflix Clone',
      origin: 'https://netflix.example.com',
    });
  });

  it('rejects an enabled feature without complete relying-party settings', () => {
    expect(() =>
      resolvePasskeyConfiguration({ AUTH_PASSKEYS_ENABLED: 'true' }, 'production'),
    ).toThrow('AUTH_WEBAUTHN_RP_ID is required');
  });

  it('rejects an insecure production origin', () => {
    expect(() =>
      resolvePasskeyConfiguration(
        {
          AUTH_PASSKEYS_ENABLED: 'true',
          AUTH_WEBAUTHN_RP_ID: 'netflix.example.com',
          AUTH_WEBAUTHN_RP_NAME: 'Netflix Clone',
          AUTH_WEBAUTHN_ORIGIN: 'http://netflix.example.com',
        },
        'production',
      ),
    ).toThrow('AUTH_WEBAUTHN_ORIGIN must use HTTPS');
  });

  it('rejects a relying-party ID outside the configured origin hostname', () => {
    expect(() =>
      resolvePasskeyConfiguration(
        {
          AUTH_PASSKEYS_ENABLED: 'true',
          AUTH_WEBAUTHN_RP_ID: 'example.net',
          AUTH_WEBAUTHN_RP_NAME: 'Netflix Clone',
          AUTH_WEBAUTHN_ORIGIN: 'https://netflix.example.com',
        },
        'production',
      ),
    ).toThrow('AUTH_WEBAUTHN_RP_ID must match the configured origin');
  });
});
