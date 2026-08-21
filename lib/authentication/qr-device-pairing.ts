import { createHash, randomBytes, randomUUID } from 'node:crypto';

const PAIRING_LIFETIME_MS = 5 * 60_000;
const MANUAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MANUAL_CODE_LENGTH = 16;

type PairingRequest = {
  id: string;
  status: 'PENDING';
  environment: string;
  manualCodeHash: string;
  approvalSecretHash: string;
  pollSecretHash: string;
  expiresAt: Date;
};

type PairingSecrets = {
  randomBytes(size: number): Buffer;
  hash(value: string): string;
};

type QrDevicePairingDependencies = {
  pairingRequests: {
    create(request: PairingRequest): Promise<void>;
    approve?(input: {
      approvalSecretHash: string;
      approverUserId: string;
      now: Date;
    }): Promise<boolean>;
  };
  recentAuthentication?: {
    isValid(input: { userId: string; sessionId: string; now: Date }): Promise<boolean>;
  };
  clock: {
    now(): Date;
  };
  secrets?: PairingSecrets;
  canonicalOrigin: string;
  environment?: string;
};

function canonicalOrigin(value: string): string {
  const origin = new URL(value);
  const isLocalhost = origin.hostname === 'localhost'
    || origin.hostname === '127.0.0.1'
    || origin.hostname === '[::1]';
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && isLocalhost)) {
    throw new Error('QR device pairing requires a canonical HTTPS origin');
  }
  return origin.origin;
}

function manualCode(bytes: Buffer): string {
  const characters = Array.from(bytes.subarray(0, MANUAL_CODE_LENGTH), (byte) =>
    MANUAL_CODE_ALPHABET[byte % MANUAL_CODE_ALPHABET.length],
  );
  return characters.join('').match(/.{1,4}/g)?.join('-') ?? '';
}

export function createQrDevicePairingService({
  pairingRequests,
  recentAuthentication,
  clock,
  secrets = {
    randomBytes,
    hash: (value) => createHash('sha256').update(value).digest('hex'),
  },
  canonicalOrigin: configuredOrigin,
  environment = process.env.DEPLOYMENT_ENVIRONMENT ?? 'unknown',
}: QrDevicePairingDependencies) {
  const origin = canonicalOrigin(configuredOrigin);

  return {
    async create() {
      const approvalSecret = secrets.randomBytes(32).toString('base64url');
      const pollSecret = secrets.randomBytes(32).toString('base64url');
      const displayCode = manualCode(secrets.randomBytes(MANUAL_CODE_LENGTH));
      const expiresAt = new Date(clock.now().getTime() + PAIRING_LIFETIME_MS);

      await pairingRequests.create({
        id: randomUUID(),
        status: 'PENDING',
        environment,
        manualCodeHash: secrets.hash(displayCode),
        approvalSecretHash: secrets.hash(approvalSecret),
        pollSecretHash: secrets.hash(pollSecret),
        expiresAt,
      });

      const approvalUrl = new URL('/auth/qr/approve', origin);
      approvalUrl.searchParams.set('pair', approvalSecret);

      return {
        expiresAt,
        manualCode: displayCode,
        approvalUrl: approvalUrl.toString(),
      };
    },

    async approve(input: {
      approvalSecret: string;
      userId: string;
      sessionId: string;
    }): Promise<{ status: 'approved' } | { status: 'rejected' }> {
      const now = clock.now();
      const isRecentlyAuthenticated = await recentAuthentication?.isValid({
        userId: input.userId,
        sessionId: input.sessionId,
        now,
      });
      if (!isRecentlyAuthenticated || !pairingRequests.approve) return { status: 'rejected' };

      const approved = await pairingRequests.approve({
        approvalSecretHash: secrets.hash(input.approvalSecret),
        approverUserId: input.userId,
        now,
      });
      return approved ? { status: 'approved' } : { status: 'rejected' };
    },
  };
}
