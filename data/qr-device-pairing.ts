import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

const TERMINAL_PAIRING_RETENTION_MS = 24 * 60 * 60_000;

export const qrDevicePairingRepository = {
  create: (request: {
    id: string; status: 'PENDING'; environment: string; manualCodeHash: string;
    approvalSecretHash: string; pollSecretHash: string; exchangeSecretHash: string; expiresAt: Date;
  }) => db.qrDevicePairingRequest.create({ data: request }).then(() => undefined),

  approve: async (input: { approvalSecretHash: string; approverUserId: string; now: Date }) => {
    const result = await db.qrDevicePairingRequest.updateMany({
      where: {
        approvalSecretHash: input.approvalSecretHash,
        status: 'PENDING',
        expiresAt: { gt: input.now },
      },
      data: { status: 'APPROVED', approverUserId: input.approverUserId, approvedAt: input.now },
    });
    return result.count === 1;
  },

  approveByManualCode: async (input: { manualCodeHash: string; approverUserId: string; now: Date }) => {
    const result = await db.qrDevicePairingRequest.updateMany({
      where: {
        manualCodeHash: input.manualCodeHash,
        status: 'PENDING',
        expiresAt: { gt: input.now },
      },
      data: { status: 'APPROVED', approverUserId: input.approverUserId, approvedAt: input.now },
    });
    return result.count === 1;
  },

  cancel: async (input: { pollSecretHash: string; now: Date }) => {
    const result = await db.qrDevicePairingRequest.updateMany({
      where: { pollSecretHash: input.pollSecretHash, status: 'PENDING', expiresAt: { gt: input.now } },
      data: { status: 'CANCELLED', cancelledAt: input.now },
    });
    return result.count === 1;
  },

  getStatus: async (input: { pollSecretHash: string; now: Date }) => {
    await db.qrDevicePairingRequest.updateMany({
      where: {
        pollSecretHash: input.pollSecretHash,
        status: 'PENDING',
        expiresAt: { lte: input.now },
      },
      data: { status: 'EXPIRED' },
    });
    const pairing = await db.qrDevicePairingRequest.findUnique({
      where: { pollSecretHash: input.pollSecretHash },
      select: { status: true },
    });
    return pairing?.status ?? null;
  },

  consumeExchange: async (input: { exchangeSecretHash: string; now: Date }) => {
    const rows = await db.$queryRaw<Array<{ approverUserId: string | null }>>(Prisma.sql`
      UPDATE "QrDevicePairingRequest"
      SET "status" = 'CONSUMED', "consumedAt" = ${input.now}
      WHERE "exchangeSecretHash" = ${input.exchangeSecretHash}
        AND "status" = 'APPROVED'
        AND "expiresAt" > ${input.now}
      RETURNING "approverUserId"
    `);
    return rows[0]?.approverUserId ?? null;
  },

  cleanup: async ({ now, limit }: { now: Date; limit: number }) => {
    await db.qrDevicePairingRequest.updateMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    const cutoff = new Date(now.getTime() - TERMINAL_PAIRING_RETENTION_MS);
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "QrDevicePairingRequest"
      WHERE ctid IN (
        SELECT ctid
        FROM "QrDevicePairingRequest"
        WHERE "status" IN ('DENIED', 'CANCELLED', 'CONSUMED', 'EXPIRED')
          AND "expiresAt" < ${cutoff}
        ORDER BY "expiresAt" ASC
        LIMIT ${limit}
      )
    `);
  },
};

export const recentAuthenticationGrantRepository = {
  upsert: (input: { userId: string; sessionId: string; expiresAt: Date }) =>
    db.recentAuthenticationGrant.upsert({
      where: { userId_sessionId: { userId: input.userId, sessionId: input.sessionId } },
      create: input,
      update: { expiresAt: input.expiresAt },
    }).then(() => undefined),

  isValid: async (input: { userId: string; sessionId: string; now: Date }) =>
    (await db.recentAuthenticationGrant.count({
      where: {
        userId: input.userId,
        sessionId: input.sessionId,
        expiresAt: { gt: input.now },
        session: { revokedAt: null, expiresAt: { gt: input.now } },
      },
    })) === 1,
};
