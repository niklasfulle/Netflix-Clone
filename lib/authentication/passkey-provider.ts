import Passkey from 'next-auth/providers/passkey';
import type { GetUserInfo } from '@auth/core/providers/webauthn';

import type { PasskeyConfiguration } from '@/lib/authentication/passkey-configuration';

export function createPasskeyProvider(
  configuration: PasskeyConfiguration,
  getUserInfo: GetUserInfo,
) {
  if (!configuration.enabled) return null;

  return Passkey({
    getUserInfo,
    enableConditionalUI: false,
    simpleWebAuthnBrowserVersion: false,
    relayingParty: {
      id: configuration.rpId,
      name: configuration.rpName,
      origin: configuration.origin,
    },
    authenticationOptions: { userVerification: 'required' },
    registrationOptions: {
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    },
    verifyAuthenticationOptions: { requireUserVerification: true },
    verifyRegistrationOptions: { requireUserVerification: true },
  });
}
