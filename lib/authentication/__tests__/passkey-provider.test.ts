import { createPasskeyProvider } from '@/lib/authentication/passkey-provider';

jest.mock('next-auth/providers/passkey', () => ({
  __esModule: true,
  default: jest.fn((configuration) => ({
    id: 'passkey',
    type: 'webauthn',
    ...configuration,
  })),
}));

describe('createPasskeyProvider', () => {
  it('does not register a provider while the feature is disabled', () => {
    expect(
      createPasskeyProvider({ enabled: false }, jest.fn()),
    ).toBeNull();
  });

  it('pins the relying party and requires verified resident credentials', () => {
    const getUserInfo = jest.fn();

    expect(
      createPasskeyProvider(
        {
          enabled: true,
          rpId: 'netflix.example.com',
          rpName: 'Netflix Clone',
          origin: 'https://netflix.example.com',
        },
        getUserInfo,
      ),
    ).toEqual(
      expect.objectContaining({
        id: 'passkey',
        type: 'webauthn',
        enableConditionalUI: false,
        simpleWebAuthnBrowserVersion: false,
        relayingParty: {
          id: 'netflix.example.com',
          name: 'Netflix Clone',
          origin: 'https://netflix.example.com',
        },
        registrationOptions: {
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'required',
          },
        },
        authenticationOptions: { userVerification: 'required' },
        verifyRegistrationOptions: { requireUserVerification: true },
        verifyAuthenticationOptions: { requireUserVerification: true },
        getUserInfo,
      }),
    );
  });
});
