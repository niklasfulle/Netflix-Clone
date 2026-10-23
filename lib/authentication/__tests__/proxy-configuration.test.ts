import { createProxyAuthenticationConfig } from '@/lib/authentication/proxy-configuration';

describe('createProxyAuthenticationConfig', () => {
  it.each([undefined, { enableWebAuthn: true }])('removes an empty experiment configuration: %j', experimental => {
    expect(createProxyAuthenticationConfig({ providers: [], experimental })).toEqual({ providers: [], experimental: undefined });
  });
  it('keeps JWT decoding providers but removes WebAuthn requirements from the request proxy', () => {
    const credentials = { id: 'credentials', type: 'credentials' };
    const passkey = { id: 'passkey', type: 'webauthn' };

    expect(createProxyAuthenticationConfig({
      providers: [credentials, passkey],
      experimental: { enableWebAuthn: true, otherExperiment: true },
    })).toEqual({
      providers: [credentials],
      experimental: { otherExperiment: true },
    });
  });
});
