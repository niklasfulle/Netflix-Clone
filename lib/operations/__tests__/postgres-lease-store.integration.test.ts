/** @jest-environment node */

import { PrismaClient } from '@prisma/client';

import {
  createOperationalLeaseCoordinator,
  OperationalLeaseLostError,
  OperationalLeaseUnavailableError,
} from '@/lib/operations/lease';
import { createPostgresOperationalLeaseStore } from '@/lib/operations/postgres-lease-store';

const runIntegration = process.env.RUN_OPERATIONAL_LEASE_INTEGRATION === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('PostgreSQL operational leases', () => {
  const databaseUrl = process.env.OPERATIONAL_LEASE_DATABASE_URL ?? '';
  const database = new PrismaClient({ datasourceUrl: databaseUrl });

  beforeAll(async () => {
    expect(databaseUrl).not.toBe('');
    await database.$executeRawUnsafe('DELETE FROM "OperationalLease"');
  });

  afterAll(async () => {
    await database.$executeRawUnsafe('DELETE FROM "OperationalLease"');
    await database.$disconnect();
  });

  it('serializes owners and preserves a monotonic fencing token after release', async () => {
    const store = createPostgresOperationalLeaseStore(database);
    const now = () => new Date('2026-08-24T12:00:00.000Z');
    const first = createOperationalLeaseCoordinator({
      store,
      now,
      createOwnerToken: () => 'postgres-owner-one',
    });
    const second = createOperationalLeaseCoordinator({
      store,
      now,
      createOwnerToken: () => 'postgres-owner-two',
    });
    let finishFirst!: () => void;
    const firstMayFinish = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    let markFirstStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve;
    });
    const target = {
      operation: 'media.scan' as const,
      targetId: 'catalog:published',
      ttlMs: 30_000,
    };

    const firstExecution = first.execute(target, async ({ fencingToken }) => {
      markFirstStarted();
      await firstMayFinish;
      return fencingToken;
    });
    await firstStarted;

    await expect(second.execute(target, async () => 'must-not-run'))
      .rejects.toBeInstanceOf(OperationalLeaseUnavailableError);

    finishFirst();
    await expect(firstExecution).resolves.toBe(BigInt(1));
    await expect(second.execute(target, async ({ fencingToken }) => fencingToken))
      .resolves.toBe(BigInt(2));
  });

  it('rejects a stale owner after an expired lease is taken over', async () => {
    const store = createPostgresOperationalLeaseStore(database);
    let currentTime = new Date('2026-08-24T13:00:00.000Z');
    const now = () => new Date(currentTime);
    const staleOwner = createOperationalLeaseCoordinator({
      store,
      now,
      createOwnerToken: () => 'postgres-stale-owner',
    });
    const newOwner = createOperationalLeaseCoordinator({
      store,
      now,
      createOwnerToken: () => 'postgres-new-owner',
    });
    let finishStaleOwner!: () => void;
    const staleOwnerMayFinish = new Promise<void>((resolve) => {
      finishStaleOwner = resolve;
    });
    let markStaleOwnerStarted!: () => void;
    const staleOwnerStarted = new Promise<void>((resolve) => {
      markStaleOwnerStarted = resolve;
    });
    const target = {
      operation: 'media.scan' as const,
      targetId: 'catalog:stale-owner',
      ttlMs: 5_000,
    };

    const staleExecution = staleOwner.execute(target, async () => {
      markStaleOwnerStarted();
      await staleOwnerMayFinish;
      return 'stale-result';
    });
    await staleOwnerStarted;

    currentTime = new Date('2026-08-24T13:00:06.000Z');
    await expect(newOwner.execute(target, async ({ fencingToken }) => fencingToken))
      .resolves.toBe(BigInt(2));
    finishStaleOwner();

    await expect(staleExecution).rejects.toBeInstanceOf(OperationalLeaseLostError);
  });
});
