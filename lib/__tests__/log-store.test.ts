/** @jest-environment node */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createLogStore, sanitizeLogDetails } from '@/lib/log-store';

describe('sanitizeLogDetails', () => {
  it('redacts secret-like fields recursively, including arrays and casing variants', () => {
    const input = {
      password: 'plain',
      nested: {
        accessToken: 'token-value',
        Authorization: 'Bearer abc',
        values: [{ COOKIE: 'session=value' }, { code: '123456' }],
      },
      safe: 'visible',
    };

    expect(sanitizeLogDetails(input)).toEqual({
      password: '[REDACTED]',
      nested: {
        accessToken: '[REDACTED]',
        Authorization: '[REDACTED]',
        values: [{ COOKIE: '[REDACTED]' }, { code: '[REDACTED]' }],
      },
      safe: 'visible',
    });
  });

  it('handles errors and circular values without exposing attached credentials', () => {
    const error = new Error('request failed');
    Object.assign(error, { token: 'raw-token', status: 500 });
    const circular: Record<string, unknown> = { error };
    circular.self = circular;

    expect(sanitizeLogDetails(circular)).toEqual({
      error: {
        name: 'Error',
        message: 'request failed',
        token: '[REDACTED]',
        status: 500,
      },
      self: '[Circular]',
    });
  });
});

describe('createLogStore', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'netflix-logs-'));
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('serializes concurrent writes without losing entries', async () => {
    const store = createLogStore({ directory, maxBytes: 64_000, maxFiles: 3 });

    await Promise.all(Array.from({ length: 40 }, (_, index) => store.write({
      timestamp: new Date(index).toISOString(),
      level: 'info',
      action: `event-${index}`,
    })));

    const result = await store.query({ page: 1, pageSize: 100 });
    expect(result.total).toBe(40);
    expect(new Set(result.logs.map((entry) => entry.action)).size).toBe(40);
  });

  it('rotates and retains only the configured number of files', async () => {
    const store = createLogStore({ directory, maxBytes: 220, maxFiles: 3 });

    for (let index = 0; index < 20; index += 1) {
      await store.write({
        timestamp: new Date(index).toISOString(),
        level: 'info',
        action: `long-event-${index}`,
        details: 'x'.repeat(80),
      });
    }

    const files = (await fs.readdir(directory)).filter((name) => name.startsWith('backend'));
    expect(files.length).toBeLessThanOrEqual(3);
  });

  it('paginates and preserves malformed entries without loading a full-file API', async () => {
    const store = createLogStore({ directory, maxBytes: 64_000, maxFiles: 3 });
    await store.write({ timestamp: '2026-01-01T00:00:00.000Z', level: 'info', action: 'first' });
    await fs.appendFile(path.join(directory, 'backend.log'), 'not-json\n', 'utf8');
    await store.write({ timestamp: '2026-01-02T00:00:00.000Z', level: 'error', action: 'second' });

    const result = await store.query({ page: 1, pageSize: 2 });

    expect(result.total).toBe(3);
    expect(result.logs[0]).toMatchObject({ action: 'second' });
    expect(result.logs[1]).toMatchObject({ level: 'unknown', raw: 'not-json' });
  });

  it('filters authentication records and keeps level counts scoped to that category', async () => {
    const store = createLogStore({ directory, maxBytes: 64_000, maxFiles: 3 });
    await store.write({ level: 'error', action: 'upload_failed', category: 'application' });
    await store.write({ level: 'info', action: 'auth.login.started', category: 'authentication' });
    await store.write({ level: 'warn', action: 'auth.login.completed', category: 'authentication' });

    const result = await store.query({
      page: 1,
      pageSize: 10,
      category: 'authentication',
    });

    expect(result.logs).toHaveLength(2);
    expect(result.logs.every((entry) => entry.category === 'authentication')).toBe(true);
    expect(result.counts).toEqual({ info: 1, warn: 1 });

    const applicationResult = await store.query({
      page: 1,
      pageSize: 10,
      category: 'application',
    });
    expect(applicationResult.logs).toEqual([
      expect.objectContaining({ action: 'upload_failed' }),
    ]);
    expect(applicationResult.counts).toEqual({ error: 1 });
  });

  it('bounds oversized entries', async () => {
    const store = createLogStore({
      directory,
      maxBytes: 64_000,
      maxFiles: 3,
      maxEntryBytes: 512,
    });

    await store.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      action: 'oversized',
      payload: 'x'.repeat(10_000),
    });

    const stat = await fs.stat(path.join(directory, 'backend.log'));
    expect(stat.size).toBeLessThanOrEqual(513);
    const result = await store.query({ page: 1, pageSize: 10 });
    expect(result.logs[0]).toMatchObject({ action: 'oversized', truncated: true });
  });

  it('reports storage failures without rejecting request-path logging', async () => {
    const invalidDirectory = path.join(directory, 'not-a-directory');
    await fs.writeFile(invalidDirectory, 'file', 'utf8');
    const onError = jest.fn();
    const store = createLogStore({ directory: invalidDirectory, onError });

    await expect(store.write({ level: 'error', action: 'failure' })).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalled();
  });
});
