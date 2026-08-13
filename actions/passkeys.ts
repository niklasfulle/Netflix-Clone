'use server';

import { currentUser } from '@/lib/auth';
import { passkeysEnabled } from '@/lib/passkey-provider';
import {
  clearPasskeyGrantCookie,
  passkeyManagement,
  readPasskeyGrantToken,
  setPasskeyGrantCookie,
} from '@/lib/passkeys';

const unavailable = () => ({
  status: 'rejected' as const,
  code: 'passkeys_unavailable' as const,
});

export async function authorizePasskeyManagement(password: string) {
  if (!passkeysEnabled) return unavailable();
  const user = await currentUser();
  if (!user?.id || !user.sessionId) {
    return { status: 'rejected' as const, code: 'unauthorized' as const };
  }

  const result = await passkeyManagement.authorize({
    userId: user.id,
    sessionId: user.sessionId,
    password,
  });
  if (result.status !== 'authorized') return result;

  await setPasskeyGrantCookie(result.token, result.expiresAt);
  return { status: 'authorized' as const, expiresAt: result.expiresAt.toISOString() };
}

export async function listPasskeys() {
  if (!passkeysEnabled) return unavailable();
  const user = await currentUser();
  if (!user?.id || !user.sessionId) {
    return { status: 'rejected' as const, code: 'unauthorized' as const };
  }

  const result = await passkeyManagement.list({
    userId: user.id,
    sessionId: user.sessionId,
    token: await readPasskeyGrantToken(),
  });
  if (result.status !== 'success') {
    if (result.code === 'reauthentication_required') await clearPasskeyGrantCookie();
    return result;
  }
  return {
    status: 'success' as const,
    passkeys: result.passkeys.map((passkey) => ({
      ...passkey,
      createdAt: passkey.createdAt.toISOString(),
      lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
    })),
  };
}

export async function renamePasskey(credentialId: string, label: string) {
  if (!passkeysEnabled) return unavailable();
  const user = await currentUser();
  if (!user?.id || !user.sessionId) {
    return { status: 'rejected' as const, code: 'unauthorized' as const };
  }

  const result = await passkeyManagement.rename({
    userId: user.id,
    sessionId: user.sessionId,
    token: await readPasskeyGrantToken(),
    credentialId,
    label,
  });
  if (result.status === 'rejected' && result.code === 'reauthentication_required') {
    await clearPasskeyGrantCookie();
  }
  return result;
}

export async function removePasskey(credentialId: string) {
  if (!passkeysEnabled) return unavailable();
  const user = await currentUser();
  if (!user?.id || !user.sessionId) {
    return { status: 'rejected' as const, code: 'unauthorized' as const };
  }

  const result = await passkeyManagement.remove({
    userId: user.id,
    sessionId: user.sessionId,
    token: await readPasskeyGrantToken(),
    credentialId,
  });
  if (result.status === 'rejected' && result.code === 'reauthentication_required') {
    await clearPasskeyGrantCookie();
  }
  return result;
}
