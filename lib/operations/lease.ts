import { createHash, randomUUID } from 'node:crypto';

export const PROTECTED_OPERATION_NAMES = [
  'backup.create',
  'backup.verify',
  'restore.verify',
  'media.scan',
  'media.cleanup',
  'deployment.adjacent',
] as const;

export type ProtectedOperationName = typeof PROTECTED_OPERATION_NAMES[number];

type LeaseIdentity = {
  resourceKey: string;
  ownerTokenHash: string;
  fencingToken: bigint;
};

type LeaseTiming = {
  now: Date;
  expiresAt: Date;
};

export type OperationalLeaseStore = {
  acquire(input: Omit<LeaseIdentity, 'fencingToken'> & LeaseTiming): Promise<{
    fencingToken: bigint;
    expiresAt: Date;
  } | null>;
  renew(input: LeaseIdentity & LeaseTiming): Promise<{
    fencingToken: bigint;
    expiresAt: Date;
  } | null>;
  isCurrent(input: LeaseIdentity & { now: Date }): Promise<boolean>;
  release(input: LeaseIdentity): Promise<boolean>;
};

export type OperationalLeaseContext = {
  fencingToken: bigint;
  resourceKey: string;
  expiresAt(): Date;
  renew(): Promise<Date>;
  assertCurrent(): Promise<void>;
};

export class OperationalLeaseUnavailableError extends Error {
  constructor(readonly operation: ProtectedOperationName) {
    super('A matching protected operation is already running');
    this.name = 'OperationalLeaseUnavailableError';
  }
}

export class OperationalLeaseLostError extends Error {
  constructor(readonly operation: ProtectedOperationName) {
    super('The protected operation no longer owns its lease');
    this.name = 'OperationalLeaseLostError';
  }
}

type CoordinatorOptions = {
  store: OperationalLeaseStore;
  now?: () => Date;
  createOwnerToken?: () => string;
};

type ExecuteOptions = {
  operation: ProtectedOperationName;
  targetId: string;
  ttlMs: number;
};

function hash(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function resourceKey(operation: ProtectedOperationName, targetId: string): string {
  const normalizedTarget = targetId.trim();
  if (normalizedTarget.length < 1 || normalizedTarget.length > 512) {
    throw new Error('Operational lease target must contain between 1 and 512 characters');
  }
  return `operation:${operation}:${hash(normalizedTarget).slice(0, 32)}`;
}

function boundedTtl(ttlMs: number): number {
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 5_000 || ttlMs > 15 * 60_000) {
    throw new Error('Operational lease TTL must be between 5000 and 900000 milliseconds');
  }
  return ttlMs;
}

export function createOperationalLeaseCoordinator({
  store,
  now = () => new Date(),
  createOwnerToken = randomUUID,
}: CoordinatorOptions) {
  return {
    async execute<T>(
      options: ExecuteOptions,
      work: (lease: OperationalLeaseContext) => Promise<T>,
    ): Promise<T> {
      const ttlMs = boundedTtl(options.ttlMs);
      const key = resourceKey(options.operation, options.targetId);
      const ownerTokenHash = hash(createOwnerToken());
      const acquiredAt = now();
      const acquired = await store.acquire({
        resourceKey: key,
        ownerTokenHash,
        now: acquiredAt,
        expiresAt: new Date(acquiredAt.getTime() + ttlMs),
      });
      if (!acquired) throw new OperationalLeaseUnavailableError(options.operation);

      let currentExpiresAt = new Date(acquired.expiresAt);
      const identity: LeaseIdentity = {
        resourceKey: key,
        ownerTokenHash,
        fencingToken: acquired.fencingToken,
      };
      const lost = () => new OperationalLeaseLostError(options.operation);
      const context: OperationalLeaseContext = {
        fencingToken: acquired.fencingToken,
        resourceKey: key,
        expiresAt: () => new Date(currentExpiresAt),
        async renew() {
          const renewedAt = now();
          if (renewedAt >= currentExpiresAt) throw lost();
          const renewed = await store.renew({
            ...identity,
            now: renewedAt,
            expiresAt: new Date(renewedAt.getTime() + ttlMs),
          });
          if (!renewed) throw lost();
          currentExpiresAt = new Date(renewed.expiresAt);
          return new Date(currentExpiresAt);
        },
        async assertCurrent() {
          if (!await store.isCurrent({ ...identity, now: now() })) throw lost();
        },
      };

      try {
        const result = await work(context);
        await context.assertCurrent();
        return result;
      } finally {
        await store.release(identity).catch(() => false);
      }
    },
  };
}
