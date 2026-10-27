import { createHash, randomUUID } from 'node:crypto';

export const PROTECTED_OPERATION_NAMES = [
  'backup.create',
  'backup.verify',
  'backup.cleanup',
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
  renewalScheduler?: RenewalScheduler;
};

type RenewalScheduler = {
  schedule(callback: () => Promise<void>, intervalMs: number): unknown;
  cancel(handle: unknown): void;
};

type ExecuteOptions = {
  operation: ProtectedOperationName;
  targetId: string;
  ttlMs: number;
};

function hash(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function resourceKey(targetId: string): string {
  const normalizedTarget = targetId.trim();
  if (normalizedTarget.length < 1 || normalizedTarget.length > 512) {
    throw new Error('Operational lease target must contain between 1 and 512 characters');
  }
  return `resource:${hash(normalizedTarget).slice(0, 32)}`;
}

function boundedTtl(ttlMs: number): number {
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 5_000 || ttlMs > 15 * 60_000) {
    throw new Error('Operational lease TTL must be between 5000 and 900000 milliseconds');
  }
  return ttlMs;
}

const defaultRenewalScheduler: RenewalScheduler = {
  schedule(callback, intervalMs) {
    const timer = setInterval(() => void callback(), intervalMs);
    timer.unref();
    return timer;
  },
  cancel(handle) {
    clearInterval(handle as ReturnType<typeof setInterval>);
  },
};

export function createOperationalLeaseCoordinator({
  store,
  now = () => new Date(),
  createOwnerToken = randomUUID,
  renewalScheduler = defaultRenewalScheduler,
}: CoordinatorOptions) {
  return {
    async execute<T>(
      options: ExecuteOptions,
      work: (lease: OperationalLeaseContext) => Promise<T>,
    ): Promise<T> {
      const ttlMs = boundedTtl(options.ttlMs);
      const key = resourceKey(options.targetId);
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
          }).catch(() => null);
          if (!renewed) throw lost();
          currentExpiresAt = new Date(renewed.expiresAt);
          return new Date(currentExpiresAt);
        },
        async assertCurrent() {
          const current = await store.isCurrent({ ...identity, now: now() })
            .catch(() => false);
          if (!current) throw lost();
        },
      };

      let stopped = false;
      let renewalFailure: unknown;
      let renewalInFlight: Promise<void> | undefined;
      const renewLease = async () => {
        if (stopped || renewalFailure) return;
        if (renewalInFlight) {
          await renewalInFlight;
          return;
        }
        renewalInFlight = context.renew()
          .then(() => undefined)
          .catch((error: unknown) => {
            renewalFailure = error;
          })
          .finally(() => {
            renewalInFlight = undefined;
          });
        await renewalInFlight;
      };
      const renewalHandle = renewalScheduler.schedule(
        renewLease,
        Math.max(1_000, Math.floor(ttlMs / 3)),
      );
      const stopRenewing = async () => {
        if (!stopped) {
          stopped = true;
          renewalScheduler.cancel(renewalHandle);
        }
        const activeRenewal = renewalInFlight;
        if (activeRenewal) await activeRenewal;
      };

      try {
        const result = await work(context);
        await stopRenewing();
        if (renewalFailure) throw renewalFailure;
        await context.assertCurrent();
        return result;
      } finally {
        await stopRenewing();
        await store.release(identity).catch(() => false);
      }
    },
  };
}
