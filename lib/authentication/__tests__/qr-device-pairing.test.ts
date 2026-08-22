import { createQrDevicePairingService } from '../qr-device-pairing';

describe('QR device pairing', () => {
  it('creates a short-lived pairing without persisting reusable secrets or identity', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const cleanup = jest.fn().mockResolvedValue(undefined);
    const service = createQrDevicePairingService({
      pairingRequests: { create, cleanup },
      clock: { now: () => new Date('2026-08-21T12:00:00.000Z') },
      secrets: {
        randomBytes: (size) => Buffer.alloc(size, 7),
        hash: (value) => `hash:${Buffer.from(value).toString('base64').slice(0, 12)}`,
      },
      canonicalOrigin: 'https://netflix.local',
    });

    const pairing = await service.create();
    const approvalSecret = new URL(pairing.approvalUrl).searchParams.get('pair');

    expect(pairing.expiresAt).toEqual(new Date('2026-08-21T12:05:00.000Z'));
    expect(pairing.manualCode).toMatch(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/);
    expect(pairing.approvalUrl).toMatch(/^https:\/\/netflix\.local\/auth\/qr\/approve\?pair=/);
    expect(approvalSecret).toHaveLength(43);
    expect(pairing.pollSecret).toHaveLength(43);
    expect(pairing.exchangeSecret).toHaveLength(43);
    expect(JSON.stringify(pairing)).not.toMatch(/session|user|account/i);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      approvalSecretHash: expect.stringMatching(/^hash:/),
      exchangeSecretHash: expect.stringMatching(/^hash:/),
      environment: 'unknown',
      expiresAt: new Date('2026-08-21T12:05:00.000Z'),
      manualCodeHash: expect.stringMatching(/^hash:/),
      pollSecretHash: expect.stringMatching(/^hash:/),
      status: 'PENDING',
    }));
    const stored = create.mock.calls[0][0];
    expect(JSON.stringify(stored)).not.toContain(approvalSecret!);
    expect(JSON.stringify(stored)).not.toContain(pairing.exchangeSecret);
    expect(JSON.stringify(stored)).not.toMatch(/sessionId|userId|accountId/);
    expect(cleanup).toHaveBeenCalledWith({
      now: new Date('2026-08-21T12:00:00.000Z'),
      limit: 50,
    });
  });

  it('approves an open request once after recent authentication', async () => {
    const approve = jest.fn().mockResolvedValue(true);
    const service = createQrDevicePairingService({
      pairingRequests: {
        create: jest.fn(),
        approve,
      },
      recentAuthentication: {
        isValid: jest.fn().mockResolvedValue(true),
      },
      clock: { now: () => new Date('2026-08-21T12:00:00.000Z') },
      secrets: {
        randomBytes: (size) => Buffer.alloc(size, 7),
        hash: (value) => `hash:${Buffer.from(value).toString('base64').slice(0, 12)}`,
      },
      canonicalOrigin: 'https://netflix.local',
    });

    await expect(service.approve({
      approvalSecret: 'approval-secret',
      userId: 'user-1',
      sessionId: 'session-1',
    })).resolves.toEqual({ status: 'approved' });

    expect(approve).toHaveBeenCalledWith({
      approvalSecretHash: expect.stringMatching(/^hash:/),
      approverUserId: 'user-1',
      now: new Date('2026-08-21T12:00:00.000Z'),
    });
  });

  it('maps unknown and terminal polling results to a non-disclosing terminal state', async () => {
    const getStatus = jest
      .fn()
      .mockResolvedValueOnce('PENDING')
      .mockResolvedValueOnce('APPROVED')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('CANCELLED');
    const service = createQrDevicePairingService({
      pairingRequests: { create: jest.fn(), getStatus },
      clock: { now: () => new Date('2026-08-21T12:00:00.000Z') },
      canonicalOrigin: 'https://netflix.local',
    });

    await expect(service.status('poll-secret')).resolves.toEqual({ status: 'pending' });
    await expect(service.status('poll-secret')).resolves.toEqual({ status: 'approved' });
    await expect(service.status('poll-secret')).resolves.toEqual({ status: 'terminal' });
    await expect(service.status('poll-secret')).resolves.toEqual({ status: 'terminal' });
  });

  it('allows an authenticated approver to use the manual fallback once', async () => {
    const approveByManualCode = jest.fn().mockResolvedValue(true);
    const service = createQrDevicePairingService({
      pairingRequests: { create: jest.fn(), approveByManualCode },
      recentAuthentication: { isValid: jest.fn().mockResolvedValue(true) },
      clock: { now: () => new Date('2026-08-21T12:00:00.000Z') },
      canonicalOrigin: 'https://netflix.local',
    });

    await expect(service.approveByManualCode({
      manualCode: 'ABCD-EFGH-JKLM-NPQR',
      userId: 'user-1',
      sessionId: 'session-1',
    })).resolves.toEqual({ status: 'approved' });
    expect(approveByManualCode).toHaveBeenCalledWith(expect.objectContaining({
      approverUserId: 'user-1',
      manualCodeHash: expect.any(String),
    }));
  });
});
