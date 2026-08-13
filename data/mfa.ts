import { randomUUID } from 'node:crypto';

import { db } from '@/lib/db';
import {
  decryptMfaSecret,
  findMatchingTotpCounter,
  hashRecoveryCode,
} from '@/lib/authentication/mfa-crypto';

export type MfaAuthenticatorRecord = {
  id: string;
  userId: string;
  secretCiphertext: string;
  verifiedAt: Date | null;
  lastUsedCounter: bigint | null;
  updatedAt: Date;
};

export async function getMfaAuthenticator(userId: string): Promise<MfaAuthenticatorRecord | null> {
  const rows = await db.$queryRaw<MfaAuthenticatorRecord[]>`
    SELECT "id", "userId", "secretCiphertext", "verifiedAt", "lastUsedCounter", "updatedAt"
    FROM "MfaAuthenticator"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function hasVerifiedMfaAuthenticator(userId: string): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ present: boolean }>>`
    SELECT EXISTS(
      SELECT 1 FROM "MfaAuthenticator"
      WHERE "userId" = ${userId} AND "verifiedAt" IS NOT NULL
    ) AS "present"
  `;
  return rows[0]?.present ?? false;
}

export async function savePendingMfaAuthenticator(
  userId: string,
  secretCiphertext: string,
): Promise<void> {
  const id = randomUUID();
  await db.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      INSERT INTO "MfaAuthenticator"
        ("id", "userId", "secretCiphertext", "verifiedAt", "lastUsedCounter", "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${secretCiphertext}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId") DO UPDATE SET
        "secretCiphertext" = EXCLUDED."secretCiphertext",
        "verifiedAt" = NULL,
        "lastUsedCounter" = NULL,
        "updatedAt" = CURRENT_TIMESTAMP
    `;
    await transaction.$executeRaw`
      DELETE FROM "MfaRecoveryCode" WHERE "userId" = ${userId}
    `;
  });
}

export async function activateMfaAuthenticator(
  userId: string,
  counter: bigint,
  recoveryCodeHashes: string[],
  now: Date,
): Promise<boolean> {
  return db.$transaction(async (transaction) => {
    const activated = await transaction.$executeRaw`
      UPDATE "MfaAuthenticator"
      SET "verifiedAt" = ${now}, "lastUsedCounter" = ${counter}, "updatedAt" = ${now}
      WHERE "userId" = ${userId} AND "verifiedAt" IS NULL
    `;
    if (activated !== 1) return false;

    await transaction.$executeRaw`
      DELETE FROM "MfaRecoveryCode" WHERE "userId" = ${userId}
    `;
    for (const codeHash of recoveryCodeHashes) {
      const id = randomUUID();
      await transaction.$executeRaw`
        INSERT INTO "MfaRecoveryCode" ("id", "userId", "codeHash", "usedAt", "createdAt")
        VALUES (${id}, ${userId}, ${codeHash}, NULL, ${now})
      `;
    }
    await transaction.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });
    return true;
  });
}

export async function consumeMfaChallenge(
  userId: string,
  code: string,
  now: Date,
): Promise<'totp' | 'recovery' | null> {
  if (/^\d{6}$/.test(code)) {
    const authenticator = await getMfaAuthenticator(userId);
    if (!authenticator?.verifiedAt) return null;
    const secret = decryptMfaSecret(authenticator.secretCiphertext);
    const counter = findMatchingTotpCounter(secret, code, now);
    if (counter === null) return null;
    const claimed = await db.$executeRaw`
      UPDATE "MfaAuthenticator"
      SET "lastUsedCounter" = ${counter}, "updatedAt" = ${now}
      WHERE "id" = ${authenticator.id}
        AND ("lastUsedCounter" IS NULL OR "lastUsedCounter" < ${counter})
    `;
    return claimed === 1 ? 'totp' : null;
  }

  const codeHash = hashRecoveryCode(userId, code);
  const claimed = await db.$executeRaw`
    UPDATE "MfaRecoveryCode"
    SET "usedAt" = ${now}
    WHERE "userId" = ${userId} AND "codeHash" = ${codeHash} AND "usedAt" IS NULL
  `;
  return claimed === 1 ? 'recovery' : null;
}

export async function removeMfa(userId: string): Promise<void> {
  await db.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      DELETE FROM "MfaRecoveryCode" WHERE "userId" = ${userId}
    `;
    await transaction.$executeRaw`
      DELETE FROM "MfaAuthenticator" WHERE "userId" = ${userId}
    `;
    await transaction.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false },
    });
  });
}
