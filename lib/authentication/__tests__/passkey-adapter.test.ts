import type { Adapter, AdapterAuthenticator } from 'next-auth/adapters';

import { withPasskeyMetadata } from '@/lib/authentication/passkey-adapter';

describe('withPasskeyMetadata', () => {
  it('records the current usage timestamp when no clock override is supplied', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T12:00:00Z'));
    try {
      const updateCounter = jest.fn().mockResolvedValue({ counter: 3 });
      const adapter = withPasskeyMetadata({}, { updateCounter });
      await expect(adapter.updateAuthenticatorCounter?.('credential', 3)).resolves.toMatchObject({ counter: 3 });
      expect(updateCounter).toHaveBeenCalledWith('credential', 3, new Date('2026-10-23T12:00:00Z'));
    } finally { jest.useRealTimers(); }
  });
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
