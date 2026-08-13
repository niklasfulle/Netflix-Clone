import { createHmac, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

import { passkeyManagementRepository } from '@/data/passkeys';
import { createPasskeyManagement } from '@/lib/authentication/passkey-management';
import { db } from '@/lib/db';

export const PASSKEY_GRANT_COOKIE = 'authjs.passkey-management-grant';

function passkeySecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required for passkey management');
  }
  return secret ?? 'development-passkey-management-secret';
}

export const passkeyManagement = createPasskeyManagement({
  repository: passkeyManagementRepository,
  async verifyPassword(userId, password) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });
    return Boolean(
      user?.hashedPassword && (await bcrypt.compare(password, user.hashedPassword)),
    );
  },
  createToken: () => randomBytes(32).toString('base64url'),
  hashToken: (token) => createHmac('sha256', passkeySecret()).update(token).digest('hex'),
  now: () => new Date(),
});

export async function readPasskeyGrantToken(): Promise<string | undefined> {
  try {
    return (await cookies()).get(PASSKEY_GRANT_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

export async function setPasskeyGrantCookie(token: string, expiresAt: Date) {
  (await cookies()).set(PASSKEY_GRANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearPasskeyGrantCookie() {
  (await cookies()).delete(PASSKEY_GRANT_COOKIE);
}

export async function hasCurrentPasskeyManagementGrant(userId: string) {
  return passkeyManagement.hasEnrollmentGrant(userId, await readPasskeyGrantToken());
}
