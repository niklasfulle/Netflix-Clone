import type { Adapter, AdapterAuthenticator } from 'next-auth/adapters';

type PasskeyMetadataRepository = {
  updateCounter(
    credentialId: string,
    counter: number,
    lastUsedAt: Date,
  ): Promise<AdapterAuthenticator>;
};

export function withPasskeyMetadata(
  adapter: Adapter,
  repository: PasskeyMetadataRepository,
  now: () => Date = () => new Date(),
): Adapter {
  return {
    ...adapter,
    updateAuthenticatorCounter(credentialId, counter) {
      return repository.updateCounter(credentialId, counter, now());
    },
  };
}
