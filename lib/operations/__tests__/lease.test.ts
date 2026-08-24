/** @jest-environment node */

import {
  createOperationalLeaseCoordinator,
  OperationalLeaseLostError,
  OperationalLeaseUnavailableError,
  type OperationalLeaseStore,
} from '@/lib/operations/lease';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function inMemoryLeaseStore(): OperationalLeaseStore {
  const leases = new Map<string, {
    ownerTokenHash: string;
    fencingToken: bigint;
    expiresAt: Date;
  }>();
  const fencingTokens = new Map<string, bigint>();

  return {
    async acquire(input) {
      const current = leases.get(input.resourceKey);
      if (current && current.expiresAt > input.now) return null;
      const fencingToken = (fencingTokens.get(input.resourceKey) ?? BigInt(0)) + BigInt(1);
      fencingTokens.set(input.resourceKey, fencingToken);
      const lease = {
        ownerTokenHash: input.ownerTokenHash,
        fencingToken,
        expiresAt: input.expiresAt,
      };
      leases.set(input.resourceKey, lease);
      return { fencingToken, expiresAt: lease.expiresAt };
    },
    async renew(input) {
      const current = leases.get(input.resourceKey);
      if (!current
        || current.ownerTokenHash !== input.ownerTokenHash
        || current.fencingToken !== input.fencingToken
        || current.expiresAt <= input.now) return null;
      current.expiresAt = input.expiresAt;
      return { fencingToken: current.fencingToken, expiresAt: current.expiresAt };
    },
    async isCurrent(input) {
      const current = leases.get(input.resourceKey);
      return Boolean(current
        && current.ownerTokenHash === input.ownerTokenHash
        && current.fencingToken === input.fencingToken
        && current.expiresAt > input.now);
    },
    async release(input) {
      const current = leases.get(input.resourceKey);
      if (!current
        || current.ownerTokenHash !== input.ownerTokenHash
        || current.fencingToken !== input.fencingToken) return false;
      leases.delete(input.resourceKey);
      return true;
    },
  };
}

it('allows only one owner to execute a protected target and increments its fencing token', async () => {
  const store = inMemoryLeaseStore();
  const now = () => new Date('2026-08-24T12:00:00.000Z');
  const firstStarted = deferred<void>();
  const finishFirst = deferred<void>();
  const firstOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'first-owner-token',
  });
  const secondOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'second-owner-token',
  });
  const target = {
    operation: 'media.scan' as const,
    targetId: 'catalog:published',
    ttlMs: 30_000,
  };

  const firstExecution = firstOwner.execute(target, async ({ fencingToken }) => {
    firstStarted.resolve();
    await finishFirst.promise;
    return fencingToken;
  });
  await firstStarted.promise;

  await expect(secondOwner.execute(target, async () => 'must-not-run'))
    .rejects.toBeInstanceOf(OperationalLeaseUnavailableError);

  finishFirst.resolve();
  await expect(firstExecution).resolves.toBe(BigInt(1));
  await expect(secondOwner.execute(target, async ({ fencingToken }) => fencingToken))
    .resolves.toBe(BigInt(2));
});

it('renews a long-running protected operation before its bounded lease expires', async () => {
  const store = inMemoryLeaseStore();
  let currentTime = new Date('2026-08-24T14:00:00.000Z');
  const now = () => new Date(currentTime);
  let scheduledRenewal: (() => Promise<void>) | undefined;
  const renewalScheduler = {
    schedule(callback: () => Promise<void>) {
      scheduledRenewal = callback;
      return Symbol('renewal');
    },
    cancel() {},
  };
  const firstStarted = deferred<void>();
  const finishFirst = deferred<void>();
  const firstOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'renewed-owner-token',
    renewalScheduler,
  });
  const secondOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'waiting-owner-token',
  });
  const target = {
    operation: 'backup.verify' as const,
    targetId: 'latest-backup',
    ttlMs: 5_000,
  };

  const firstExecution = firstOwner.execute(target, async ({ fencingToken }) => {
    firstStarted.resolve();
    await finishFirst.promise;
    return fencingToken;
  });
  await firstStarted.promise;

  currentTime = new Date('2026-08-24T14:00:04.000Z');
  await scheduledRenewal?.();
  currentTime = new Date('2026-08-24T14:00:06.000Z');

  await expect(secondOwner.execute(target, async () => 'must-not-run'))
    .rejects.toBeInstanceOf(OperationalLeaseUnavailableError);

  finishFirst.resolve();
  await expect(firstExecution).resolves.toBe(BigInt(1));
});

it('fails closed when lease renewal loses the coordination store', async () => {
  const backingStore = inMemoryLeaseStore();
  const store: OperationalLeaseStore = {
    ...backingStore,
    async renew() {
      throw new Error('coordination store unavailable');
    },
  };
  let scheduledRenewal: (() => Promise<void>) | undefined;
  const renewalScheduler = {
    schedule(callback: () => Promise<void>) {
      scheduledRenewal = callback;
      return Symbol('renewal');
    },
    cancel() {},
  };
  const started = deferred<void>();
  const finish = deferred<void>();
  const coordinator = createOperationalLeaseCoordinator({
    store,
    now: () => new Date('2026-08-24T15:00:01.000Z'),
    createOwnerToken: () => 'partitioned-owner-token',
    renewalScheduler,
  });

  const execution = coordinator.execute({
    operation: 'media.cleanup',
    targetId: 'catalog:orphaned-media',
    ttlMs: 5_000,
  }, async () => {
    started.resolve();
    await finish.promise;
    return 'must-not-succeed';
  });
  await started.promise;

  await scheduledRenewal?.();
  finish.resolve();

  await expect(execution).rejects.toBeInstanceOf(OperationalLeaseLostError);
});

it('does not report success when the final ownership check is unavailable', async () => {
  const backingStore = inMemoryLeaseStore();
  const store: OperationalLeaseStore = {
    ...backingStore,
    async isCurrent() {
      throw new Error('coordination store unavailable');
    },
  };
  const coordinator = createOperationalLeaseCoordinator({
    store,
    now: () => new Date('2026-08-24T16:00:00.000Z'),
    createOwnerToken: () => 'final-check-owner-token',
  });

  await expect(coordinator.execute({
    operation: 'deployment.adjacent',
    targetId: 'staging',
    ttlMs: 30_000,
  }, async () => 'must-not-succeed')).rejects.toBeInstanceOf(OperationalLeaseLostError);
});

it('prevents backup creation and restore from running against the same database', async () => {
  const store = inMemoryLeaseStore();
  const now = () => new Date('2026-08-24T17:00:00.000Z');
  const backupStarted = deferred<void>();
  const finishBackup = deferred<void>();
  const backupOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'backup-owner-token',
  });
  const restoreOwner = createOperationalLeaseCoordinator({
    store,
    now,
    createOwnerToken: () => 'restore-owner-token',
  });

  const backupExecution = backupOwner.execute({
    operation: 'backup.create',
    targetId: 'database',
    ttlMs: 30_000,
  }, async () => {
    backupStarted.resolve();
    await finishBackup.promise;
  });
  await backupStarted.promise;

  await expect(restoreOwner.execute({
    operation: 'restore.verify',
    targetId: 'database',
    ttlMs: 30_000,
  }, async () => 'must-not-run')).rejects.toBeInstanceOf(OperationalLeaseUnavailableError);

  finishBackup.resolve();
  await expect(backupExecution).resolves.toBeUndefined();
});
