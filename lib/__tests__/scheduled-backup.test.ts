/** @jest-environment node */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  requestScheduledBackup,
  ScheduledBackupBusyError,
  ScheduledBackupRequestError,
} from '@/lib/scheduled-backup';

describe('scheduled backup host request', () => {
  it('publishes one atomic request and rejects a concurrent request', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-scheduled-backup-'));
    const requestPath = path.join(directory, 'request.json');
    const request = {
      schemaVersion: 1 as const,
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      requestedAt: '2026-08-27T08:00:00.000Z',
      environment: 'staging' as const,
    };

    try {
      await requestScheduledBackup(request, requestPath);
      expect(JSON.parse(await readFile(requestPath, 'utf8'))).toEqual(request);
      await expect(requestScheduledBackup({
        ...request,
        requestId: '750e8400-e29b-41d4-a716-446655440000',
      }, requestPath)).rejects.toBeInstanceOf(ScheduledBackupBusyError);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects unbounded or unsupported request data before touching the host bridge', async () => {
    await expect(requestScheduledBackup({
      schemaVersion: 1,
      requestId: 'not-a-uuid',
      requestedAt: 'invalid',
      environment: 'staging',
    })).rejects.toBeInstanceOf(ScheduledBackupRequestError);
  });
});
