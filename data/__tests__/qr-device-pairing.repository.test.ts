jest.mock('@/lib/db', () => ({
  db: {
    qrDevicePairingRequest: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    recentAuthenticationGrant: {
      upsert: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));

import {
  qrDevicePairingRepository,
  recentAuthenticationGrantRepository,
} from '@/data/qr-device-pairing';
import { db } from '@/lib/db';

const mockPairingRequest = {
  create: db.qrDevicePairingRequest.create as unknown as jest.Mock,
  updateMany: db.qrDevicePairingRequest.updateMany as unknown as jest.Mock,
  findUnique: db.qrDevicePairingRequest.findUnique as unknown as jest.Mock,
};
const mockRecentAuthenticationGrant = {
  upsert: db.recentAuthenticationGrant.upsert as unknown as jest.Mock,
  count: db.recentAuthenticationGrant.count as unknown as jest.Mock,
};
const mockQueryRaw = db.$queryRaw as unknown as jest.Mock;
const mockExecuteRaw = db.$executeRaw as unknown as jest.Mock;

describe('QR device pairing persistence', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a pending Device Pairing Request without exposing a persistence result', async () => {
    const request = {
      id: 'pairing-1',
      status: 'PENDING' as const,
      environment: 'staging',
      manualCodeHash: 'manual-hash',
      approvalSecretHash: 'approval-hash',
      pollSecretHash: 'poll-hash',
      exchangeSecretHash: 'exchange-hash',
      expiresAt: new Date('2026-08-23T12:05:00.000Z'),
    };
    mockPairingRequest.create.mockResolvedValue({ id: request.id });

    await expect(qrDevicePairingRepository.create(request)).resolves.toBeUndefined();
    expect(mockPairingRequest.create).toHaveBeenCalledWith({ data: request });
  });

  it('approves, manually approves, or cancels only one pending unexpired request', async () => {
    mockPairingRequest.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    await expect(qrDevicePairingRepository.approve({
      approvalSecretHash: 'approval-hash',
      approverUserId: 'user-1',
      now,
    })).resolves.toBe(true);
    await expect(qrDevicePairingRepository.approve({
      approvalSecretHash: 'unknown-hash',
      approverUserId: 'user-1',
      now,
    })).resolves.toBe(false);
    await expect(qrDevicePairingRepository.approveByManualCode({
      manualCodeHash: 'manual-hash',
      approverUserId: 'user-1',
      now,
    })).resolves.toBe(true);
    await expect(qrDevicePairingRepository.cancel({
      pollSecretHash: 'poll-hash',
      now,
    })).resolves.toBe(true);

    expect(mockPairingRequest.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        approvalSecretHash: 'approval-hash',
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      data: { status: 'APPROVED', approverUserId: 'user-1', approvedAt: now },
    });
    expect(mockPairingRequest.updateMany).toHaveBeenNthCalledWith(3, {
      where: {
        manualCodeHash: 'manual-hash',
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      data: { status: 'APPROVED', approverUserId: 'user-1', approvedAt: now },
    });
    expect(mockPairingRequest.updateMany).toHaveBeenNthCalledWith(4, {
      where: { pollSecretHash: 'poll-hash', status: 'PENDING', expiresAt: { gt: now } },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
  });

  it('expires pending requests before returning their current status', async () => {
    mockPairingRequest.updateMany.mockResolvedValue({ count: 1 });
    mockPairingRequest.findUnique
      .mockResolvedValueOnce({ status: 'EXPIRED' })
      .mockResolvedValueOnce(null);

    await expect(qrDevicePairingRepository.getStatus({ pollSecretHash: 'poll-hash', now }))
      .resolves.toBe('EXPIRED');
    await expect(qrDevicePairingRepository.getStatus({ pollSecretHash: 'missing-hash', now }))
      .resolves.toBeNull();

    expect(mockPairingRequest.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        pollSecretHash: 'poll-hash',
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });
    expect(mockPairingRequest.findUnique).toHaveBeenNthCalledWith(1, {
      where: { pollSecretHash: 'poll-hash' },
      select: { status: true },
    });
  });

  it('returns the Approver only when an approved exchange is consumed', async () => {
    mockQueryRaw
      .mockResolvedValueOnce([{ approverUserId: 'user-1' }])
      .mockResolvedValueOnce([{ approverUserId: null }])
      .mockResolvedValueOnce([]);

    await expect(qrDevicePairingRepository.consumeExchange({
      exchangeSecretHash: 'exchange-hash',
      now,
    })).resolves.toBe('user-1');
    await expect(qrDevicePairingRepository.consumeExchange({
      exchangeSecretHash: 'exchange-without-approver',
      now,
    })).resolves.toBeNull();
    await expect(qrDevicePairingRepository.consumeExchange({
      exchangeSecretHash: 'already-consumed',
      now,
    })).resolves.toBeNull();

    expect(mockQueryRaw).toHaveBeenCalledTimes(3);
  });

  it('expires pending requests and removes terminal requests after the retention window', async () => {
    mockPairingRequest.updateMany.mockResolvedValue({ count: 2 });
    mockExecuteRaw.mockResolvedValue(3);

    await qrDevicePairingRepository.cleanup({ now, limit: 50 });

    expect(mockPairingRequest.updateMany).toHaveBeenCalledWith({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('stores and validates a recent-authentication grant against an active session', async () => {
    const expiresAt = new Date('2026-08-23T12:10:00.000Z');
    mockRecentAuthenticationGrant.upsert.mockResolvedValue({ userId: 'user-1' });
    mockRecentAuthenticationGrant.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(recentAuthenticationGrantRepository.upsert({
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt,
    })).resolves.toBeUndefined();
    await expect(recentAuthenticationGrantRepository.isValid({
      userId: 'user-1',
      sessionId: 'session-1',
      now,
    })).resolves.toBe(true);
    await expect(recentAuthenticationGrantRepository.isValid({
      userId: 'user-1',
      sessionId: 'revoked-session',
      now,
    })).resolves.toBe(false);

    expect(mockRecentAuthenticationGrant.upsert).toHaveBeenCalledWith({
      where: { userId_sessionId: { userId: 'user-1', sessionId: 'session-1' } },
      create: { userId: 'user-1', sessionId: 'session-1', expiresAt },
      update: { expiresAt },
    });
    expect(mockRecentAuthenticationGrant.count).toHaveBeenNthCalledWith(1, {
      where: {
        userId: 'user-1',
        sessionId: 'session-1',
        expiresAt: { gt: now },
        session: { revokedAt: null, expiresAt: { gt: now } },
      },
    });
  });
});
