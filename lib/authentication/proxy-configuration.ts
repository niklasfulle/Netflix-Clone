type AuthenticationProvider = {
  id?: string;
  type?: string;
};

type ProxyCompatibleConfiguration = {
  providers: AuthenticationProvider[];
  experimental?: Record<string, unknown>;
};

export function createProxyAuthenticationConfig<T extends ProxyCompatibleConfiguration>(
  configuration: T,
) {
  const experimental = { ...configuration.experimental };
  delete experimental.enableWebAuthn;

  return {
    ...configuration,
    providers: configuration.providers.filter(
      (provider) => provider.id !== 'passkey' && provider.type !== 'webauthn',
    ),
    ...(Object.keys(experimental).length > 0 ? { experimental } : { experimental: undefined }),
  };
}
