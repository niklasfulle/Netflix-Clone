/** @jest-environment node */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import {
  requestScheduledBackup,
  ScheduledBackupBusyError,
  ScheduledBackupRequestError,
} from '@/lib/scheduled-backup';

describe('scheduled backup host request', () => {
  it('uses the configured request path and cleans temporary files after a non-conflict publication failure', async () => {
    const previous = process.env.SCHEDULED_BACKUP_REQUEST_PATH;
    process.env.SCHEDULED_BACKUP_REQUEST_PATH = path.join(os.tmpdir(), 'configured-backup', 'request.json');
    const failure = Object.assign(new Error('Access denied'), { code: 'EACCES' });
    const mkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const write = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const link = jest.spyOn(fs, 'link').mockRejectedValue(failure);
    const remove = jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
    try {
      await expect(requestScheduledBackup({ schemaVersion: 1, requestId: '550e8400-e29b-41d4-a716-446655440000', requestedAt: '2026-08-27T08:00:00.000Z', environment: 'production' })).rejects.toBe(failure);
      expect(link).toHaveBeenCalledWith(expect.stringContaining('.tmp'), process.env.SCHEDULED_BACKUP_REQUEST_PATH);
      expect(remove).toHaveBeenCalledWith(expect.stringContaining('.tmp'), { force: true });
    } finally {
      mkdir.mockRestore(); write.mockRestore(); link.mockRestore(); remove.mockRestore();
      if (previous === undefined) delete process.env.SCHEDULED_BACKUP_REQUEST_PATH;
      else process.env.SCHEDULED_BACKUP_REQUEST_PATH = previous;
    }
  });
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
