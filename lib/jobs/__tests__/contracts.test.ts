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
