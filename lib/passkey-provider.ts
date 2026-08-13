import { getUserByEmail } from '@/data/user';
import { createPasskeyProvider } from '@/lib/authentication/passkey-provider';
import { resolvePasskeyConfiguration } from '@/lib/authentication/passkey-configuration';
import { createExistingPasskeyUserResolver } from '@/lib/authentication/passkey-user';
import { hasActiveUserBlock } from '@/lib/user-access';

export const passkeyConfiguration = resolvePasskeyConfiguration(
  {
    AUTH_PASSKEYS_ENABLED: process.env.AUTH_PASSKEYS_ENABLED,
    AUTH_WEBAUTHN_RP_ID: process.env.AUTH_WEBAUTHN_RP_ID,
    AUTH_WEBAUTHN_RP_NAME: process.env.AUTH_WEBAUTHN_RP_NAME,
    AUTH_WEBAUTHN_ORIGIN: process.env.AUTH_WEBAUTHN_ORIGIN,
  },
  process.env.NODE_ENV,
);

const getUserInfo = createExistingPasskeyUserResolver({
  findByEmail: getUserByEmail,
  isBlocked: hasActiveUserBlock,
});

export const configuredPasskeyProvider = createPasskeyProvider(
  passkeyConfiguration,
  getUserInfo,
);

export const passkeysEnabled = passkeyConfiguration.enabled;
