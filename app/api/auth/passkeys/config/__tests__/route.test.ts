/** @jest-environment node */

jest.mock('@/lib/passkey-provider', () => ({ passkeysEnabled: true }));

import { GET } from '@/app/api/auth/passkeys/config/route';

describe('GET /api/auth/passkeys/config', () => {
  it('exposes only whether the runtime feature is enabled', async () => {
    await expect((await GET()).json()).resolves.toEqual({ enabled: true });
  });
});
