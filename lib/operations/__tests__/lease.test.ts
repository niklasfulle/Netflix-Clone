/** @jest-environment node */

import {
  createOperationalLeaseCoordinator,
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
