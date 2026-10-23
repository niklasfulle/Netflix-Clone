/** @jest-environment node */

import {
  BackupCreationJobError,
  createBackupCreationJobHandler,
} from '@/lib/jobs/backup-creation-job';

const payload = {
  scope: 'scheduled' as const,
  environment: 'staging' as const,
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  requestedAt: '2026-08-27T08:00:00.000Z',
};

it.each([
  { pollIntervalMs: 249 }, { pollIntervalMs: 10_001 }, { pollIntervalMs: 250.5 },
  { maxPolls: 0 }, { maxPolls: 1801 }, { maxPolls: 1.5 },
])('rejects invalid polling configuration: %o', options => {
  expect(() => createBackupCreationJobHandler({ submitRequest: jest.fn(), readStatus: jest.fn(), ...options })).toThrow('outside its allowed range');
});

it('times out pending backup requests using the default cancellable wait', async () => {
  const reportProgress = jest.fn();
  const handler = createBackupCreationJobHandler({ submitRequest: jest.fn(), readStatus: jest.fn().mockResolvedValue(null), pollIntervalMs: 250, maxPolls: 1 });
  await expect(handler(payload, { reportProgress })).rejects.toMatchObject({ diagnosticCode: 'BACKUP_POLL_TIMEOUT' });
  expect(reportProgress).toHaveBeenLastCalledWith({ percent: 15, message: 'Database backup pending' });
});

it('cancels a pending backup promptly when the worker is stopped', async () => {
  const controller = new AbortController();
  controller.abort();
  const handler = createBackupCreationJobHandler({ submitRequest: jest.fn(), readStatus: jest.fn().mockResolvedValue(null) });
  await expect(handler(payload, { reportProgress: jest.fn(), signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});

it('waits for a newly created and verified backup', async () => {
  const readStatus = jest.fn()
    .mockResolvedValueOnce({ requestId: null, environment: 'staging', backupName: 'scheduled-staging-old.dump', status: 'VERIFIED' })
    .mockResolvedValueOnce({ requestId: payload.requestId, environment: 'staging', backupName: 'scheduled-staging-new.dump', status: 'RUNNING' })
    .mockResolvedValueOnce({ requestId: payload.requestId, environment: 'staging', backupName: 'scheduled-staging-new.dump', status: 'VERIFIED' });
  const submitRequest = jest.fn().mockResolvedValue(undefined);
  const reportProgress = jest.fn().mockResolvedValue(undefined);
  const handler = createBackupCreationJobHandler({
    submitRequest,
    readStatus,
    wait: jest.fn().mockResolvedValue(undefined),
    pollIntervalMs: 250,
    maxPolls: 3,
  });

  await expect(handler(payload, { reportProgress })).resolves.toEqual({
    backupRequestId: payload.requestId,
    status: 'VERIFIED',
    environment: 'staging',
    backupName: 'scheduled-staging-new.dump',
  });
  expect(submitRequest).toHaveBeenCalledWith({
    schemaVersion: 1,
    requestId: payload.requestId,
    requestedAt: payload.requestedAt,
    environment: 'staging',
  });
});

it('surfaces the host backup diagnostic when creation fails', async () => {
  const handler = createBackupCreationJobHandler({
    submitRequest: jest.fn().mockResolvedValue(undefined),
    readStatus: jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        requestId: payload.requestId,
        environment: 'staging',
        backupName: 'scheduled-staging-failed.dump',
        status: 'FAILED',
        diagnosticCode: 'BACKUP_FAILED',
      }),
    wait: jest.fn().mockResolvedValue(undefined),
    pollIntervalMs: 250,
    maxPolls: 1,
  });

  await expect(handler(payload, { reportProgress: jest.fn() }))
    .rejects.toEqual(expect.objectContaining<Partial<BackupCreationJobError>>({
      diagnosticCode: 'BACKUP_FAILED',
    }));
});
