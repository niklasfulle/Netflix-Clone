/** @jest-environment node */

import { MAX_JOB_AGE_MS, parseQueuedJob, parseJobSubmission } from '@/lib/jobs/contracts';

describe('background job contracts', () => {
  it('accepts a versioned media integrity scan with bounded ownership metadata', () => {
    expect(parseJobSubmission({
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'catalog' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
    })).toEqual({
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'catalog' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
    });
  });

  it('accepts a versioned latest-backup verification request', () => {
    expect(parseJobSubmission({
      name: 'backup.verification.request',
      version: 1,
      payload: {
        scope: 'latest',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-24T18:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup', id: 'latest' },
      idempotencyKey: 'backup-verify-request-123',
      correlationId: 'request-correlation-123',
    })).toEqual({
      name: 'backup.verification.request',
      version: 1,
      payload: {
        scope: 'latest',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-24T18:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup', id: 'latest' },
      idempotencyKey: 'backup-verify-request-123',
      correlationId: 'request-correlation-123',
    });
  });

  it('accepts a scheduled backup creation request scoped to its environment', () => {
    expect(parseJobSubmission({
      name: 'backup.creation.request',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: 'production',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-27T08:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup', id: 'production' },
      idempotencyKey: 'scheduled-backup-request-123',
      correlationId: 'request-correlation-123',
    }).name).toBe('backup.creation.request');

    expect(() => parseJobSubmission({
      name: 'backup.creation.request',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: 'production',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-27T08:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup', id: 'staging' },
      idempotencyKey: 'scheduled-backup-request-123',
      correlationId: 'request-correlation-123',
    })).toThrow('environment');
  });

  it('accepts a bounded scheduled-backup retention request without host paths', () => {
    expect(parseJobSubmission({
      name: 'backup.retention.cleanup',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: 'staging',
        requestId: '750e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-24T19:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup_retention', id: 'staging' },
      idempotencyKey: 'backup-retention-request-123',
      correlationId: 'request-correlation-123',
    })).toEqual({
      name: 'backup.retention.cleanup',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: 'staging',
        requestId: '750e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-24T19:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup_retention', id: 'staging' },
      idempotencyKey: 'backup-retention-request-123',
      correlationId: 'request-correlation-123',
    });
  });

  it('accepts a current scheduled-backup retention queue envelope', () => {
    expect(parseQueuedJob({
      name: 'backup.retention.cleanup',
      version: 1,
      payload: {
        scope: 'scheduled',
        environment: 'production',
        requestId: '750e8400-e29b-41d4-a716-446655440000',
        requestedAt: '2026-08-24T19:00:00.000Z',
      },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'backup_retention', id: 'production' },
      idempotencyKey: 'backup-retention-request-123',
      correlationId: 'request-correlation-123',
      jobRunId: 'retention-job-run-123',
      acceptedAt: '2026-08-24T19:00:00.000Z',
    }, new Date('2026-08-24T19:01:00.000Z')).name).toBe('backup.retention.cleanup');
  });

  it('rejects unsupported contract versions instead of guessing compatibility', () => {
    expect(() => parseJobSubmission({
      name: 'media.integrity.scan',
      version: 2,
      payload: { scope: 'catalog' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
    })).toThrow();
  });

  it('rejects arbitrary job names, commands, and unknown payload fields', () => {
    expect(() => parseJobSubmission({
      name: 'system.command',
      version: 1,
      payload: { command: 'rm', path: '/' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
    })).toThrow();
  });

  it('rejects stale queue envelopes before execution', () => {
    const acceptedAt = new Date('2026-08-20T10:00:00.000Z');
    expect(() => parseQueuedJob({
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'catalog' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
      jobRunId: 'job-run-123',
      acceptedAt: acceptedAt.toISOString(),
    }, new Date(acceptedAt.getTime() + MAX_JOB_AGE_MS + 1))).toThrow('stale');
  });

  it('rejects oversized queue envelopes', () => {
    expect(() => parseQueuedJob({
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'catalog' },
      actor: { userId: 'admin-user-123', role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey: 'fB7qM4e0xvA9kT3sN8wL2c',
      correlationId: 'request-correlation-123',
      jobRunId: 'job-run-123',
      acceptedAt: '2026-08-23T10:00:00.000Z',
      padding: 'x'.repeat(9_000),
    }, new Date('2026-08-23T10:01:00.000Z'))).toThrow('size');
  });
});
