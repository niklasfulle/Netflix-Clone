import { db } from '@/lib/db';

export const qrDevicePairingRepository = {
  create: (request: {
    id: string; status: 'PENDING'; environment: string; manualCodeHash: string;
    approvalSecretHash: string; pollSecretHash: string; expiresAt: Date;
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

  cancel: async (input: { pollSecretHash: string; now: Date }) => {
    const result = await db.qrDevicePairingRequest.updateMany({
      where: { pollSecretHash: input.pollSecretHash, status: 'PENDING', expiresAt: { gt: input.now } },
      data: { status: 'CANCELLED', cancelledAt: input.now },
    });
    return result.count === 1;
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
