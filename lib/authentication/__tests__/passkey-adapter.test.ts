import type { Adapter, AdapterAuthenticator } from 'next-auth/adapters';

import { withPasskeyMetadata } from '@/lib/authentication/passkey-adapter';

describe('withPasskeyMetadata', () => {
  it('updates the signature counter and last-used timestamp atomically', async () => {
    const originalUpdate = jest.fn();
    const updated = {
      credentialID: 'credential-1',
      userId: 'user-1',
      providerAccountId: 'provider-account-1',
      credentialPublicKey: 'public-key',
      counter: 7,
      credentialDeviceType: 'multiDevice',
      credentialBackedUp: true,
      transports: 'internal',
    } satisfies AdapterAuthenticator;
    const updateCounter = jest.fn().mockResolvedValue(updated);
    const now = new Date('2026-08-12T18:30:00.000Z');
    const adapter = withPasskeyMetadata(
      { updateAuthenticatorCounter: originalUpdate } as Adapter,
      { updateCounter },
      () => now,
    );

    await expect(adapter.updateAuthenticatorCounter?.('credential-1', 7)).resolves.toBe(
      updated,
    );
    expect(updateCounter).toHaveBeenCalledWith('credential-1', 7, now);
    expect(originalUpdate).not.toHaveBeenCalled();
  });
});
