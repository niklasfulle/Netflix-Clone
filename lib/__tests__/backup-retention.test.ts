/** @jest-environment node */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  BackupRetentionBusyError,
  BackupRetentionStatusError,
  readBackupRetentionStatus,
  requestBackupRetention,
} from '@/lib/backup-retention';

it('reads only bounded versioned retention status metadata', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-retention-status-'));
  const statusPath = path.join(directory, 'latest.json');
  const status = {
    schemaVersion: 1,
    requestId: '750e8400-e29b-41d4-a716-446655440000',
    environment: 'staging',
    status: 'COMPLETED',
    diagnosticCode: 'RETENTION_COMPLETED',
    retainedCount: 9,
    removedCount: 2,
    completedAt: '2026-08-24T19:00:10.000Z',
  };

  try {
    await writeFile(statusPath, JSON.stringify(status));
    await expect(readBackupRetentionStatus(statusPath)).resolves.toEqual(status);
    await writeFile(statusPath, JSON.stringify({ ...status, environment: 'development' }));
    await expect(readBackupRetentionStatus(statusPath)).rejects.toBeInstanceOf(
      BackupRetentionStatusError,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('publishes one atomic retention request and rejects a concurrent request', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'netflix-retention-request-'));
  const requestPath = path.join(directory, 'request.json');
  const request = {
    schemaVersion: 1 as const,
    requestId: '750e8400-e29b-41d4-a716-446655440000',
    requestedAt: '2026-08-24T19:00:00.000Z',
    environment: 'staging' as const,
  };

  try {
    await requestBackupRetention(request, requestPath);
    expect(JSON.parse(await readFile(requestPath, 'utf8'))).toEqual(request);
    await expect(requestBackupRetention({
      ...request,
      requestId: '850e8400-e29b-41d4-a716-446655440000',
    }, requestPath)).rejects.toBeInstanceOf(BackupRetentionBusyError);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
