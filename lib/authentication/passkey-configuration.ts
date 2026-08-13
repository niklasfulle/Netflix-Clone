type PasskeyEnvironment = Partial<
  Record<
    | 'AUTH_PASSKEYS_ENABLED'
    | 'AUTH_WEBAUTHN_RP_ID'
    | 'AUTH_WEBAUTHN_RP_NAME'
    | 'AUTH_WEBAUTHN_ORIGIN',
    string
  >
>;

export type PasskeyConfiguration =
  | { enabled: false }
  | {
      enabled: true;
      rpId: string;
      rpName: string;
      origin: string;
    };

export function resolvePasskeyConfiguration(
  environment: PasskeyEnvironment,
  nodeEnvironment = process.env.NODE_ENV,
): PasskeyConfiguration {
  if (environment.AUTH_PASSKEYS_ENABLED !== 'true') return { enabled: false };

  const rpId = required(environment.AUTH_WEBAUTHN_RP_ID, 'AUTH_WEBAUTHN_RP_ID').toLowerCase();
  const rpName = required(environment.AUTH_WEBAUTHN_RP_NAME, 'AUTH_WEBAUTHN_RP_NAME');
  const origin = required(environment.AUTH_WEBAUTHN_ORIGIN, 'AUTH_WEBAUTHN_ORIGIN');
  const parsedOrigin = parseOrigin(origin);
  const insecureLocalhost =
    nodeEnvironment !== 'production' &&
    parsedOrigin.protocol === 'http:' &&
    parsedOrigin.hostname === 'localhost';
  if (parsedOrigin.protocol !== 'https:' && !insecureLocalhost) {
    throw new Error('AUTH_WEBAUTHN_ORIGIN must use HTTPS');
  }
  if (
    parsedOrigin.hostname !== rpId &&
    !parsedOrigin.hostname.endsWith(`.${rpId}`)
  ) {
    throw new Error('AUTH_WEBAUTHN_RP_ID must match the configured origin');
  }

  return {
    enabled: true,
    rpId,
    rpName,
    origin,
  };
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required when passkeys are enabled`);
  return value.trim();
}

function parseOrigin(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('AUTH_WEBAUTHN_ORIGIN must be a valid origin');
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('AUTH_WEBAUTHN_ORIGIN must be an origin without path or credentials');
  }
  return parsed;
}
