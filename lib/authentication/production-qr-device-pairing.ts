import { qrDevicePairingRepository, recentAuthenticationGrantRepository } from '@/data/qr-device-pairing';

import { createQrDevicePairingService } from './qr-device-pairing';

function configuredOrigin(): string {
  const origin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!origin) throw new Error('AUTH_URL is required for QR device pairing');
  return origin;
}

export function qrDevicePairingService() {
  return createQrDevicePairingService({
    pairingRequests: qrDevicePairingRepository,
    recentAuthentication: recentAuthenticationGrantRepository,
    clock: { now: () => new Date() },
    canonicalOrigin: configuredOrigin(),
  });
}
