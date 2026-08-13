import type { AdapterAuthenticator } from 'next-auth/adapters';

import { db } from '@/lib/db';
import type { PasskeyManagementRepository } from '@/lib/authentication/passkey-management';

const GRANT_CLEANUP_BATCH = 50;

export const passkeyMetadataRepository = {
  async updateCounter(
    credentialId: string,
    counter: number,
    lastUsedAt: Date,
  ): Promise<AdapterAuthenticator> {
    return db.authenticator.update({
      where: { credentialID: credentialId },
      data: { counter, lastUsedAt },
    });
  },
};

export const passkeyManagementRepository: PasskeyManagementRepository = {
  async createGrant(grant) {
    await db.$transaction([
      db.passkeyManagementGrant.deleteMany({
        where: { userId: grant.userId, sessionId: grant.sessionId },
      }),
      db.passkeyManagementGrant.create({ data: grant }),
    ]);
  },

  async hasActiveGrant(tokenHash, userId, sessionId, now) {
    return (await db.passkeyManagementGrant.count({
      where: {
        tokenHash,
        userId,
        ...(sessionId ? { sessionId } : {}),
        expiresAt: { gt: now },
        session: { revokedAt: null, expiresAt: { gt: now } },
      },
    })) === 1;
  },

  async cleanupGrants(now) {
    const expired = await db.passkeyManagementGrant.findMany({
      where: { expiresAt: { lte: now } },
      select: { tokenHash: true },
      take: GRANT_CLEANUP_BATCH,
    });
    if (expired.length > 0) {
      await db.passkeyManagementGrant.deleteMany({
        where: { tokenHash: { in: expired.map(({ tokenHash }) => tokenHash) } },
      });
    }
  },

  async list(userId) {
    const authenticators = await db.authenticator.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return authenticators.map((authenticator) => ({
      credentialId: authenticator.credentialID,
      label: authenticator.label,
      deviceType: authenticator.credentialDeviceType,
      backedUp: authenticator.credentialBackedUp,
      transports: authenticator.transports,
      createdAt: authenticator.createdAt,
      lastUsedAt: authenticator.lastUsedAt,
    }));
  },

  async rename(userId, credentialId, label) {
    const result = await db.authenticator.updateMany({
      where: { userId, credentialID: credentialId },
      data: { label },
    });
    return result.count === 1;
  },

  async removeRecoverySafe(userId, credentialId) {
    return db.$transaction(async (transaction) => {
      const authenticator = await transaction.authenticator.findFirst({
        where: { userId, credentialID: credentialId },
      });
      if (!authenticator) return 'not_found' as const;

      const [user, alternativePasskeys, alternativeAccounts] = await Promise.all([
        transaction.user.findUnique({
          where: { id: userId },
          select: { hashedPassword: true },
        }),
        transaction.authenticator.count({
          where: { userId, credentialID: { not: credentialId } },
        }),
        transaction.account.count({
          where: { userId, provider: { not: 'passkey' } },
        }),
      ]);
      if (!user) return 'not_found' as const;
      if (!user.hashedPassword && alternativePasskeys === 0 && alternativeAccounts === 0) {
        return 'last_sign_in_method' as const;
      }

      await transaction.authenticator.delete({
        where: {
          userId_credentialID: { userId, credentialID: credentialId },
        },
      });
      const remainingForAccount = await transaction.authenticator.count({
        where: { userId, providerAccountId: authenticator.providerAccountId },
      });
      if (remainingForAccount === 0) {
        await transaction.account.deleteMany({
          where: {
            userId,
            provider: 'passkey',
            providerAccountId: authenticator.providerAccountId,
          },
        });
      }
      return 'removed' as const;
    });
  },
};
