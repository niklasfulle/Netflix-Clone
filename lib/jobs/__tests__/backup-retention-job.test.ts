/** @jest-environment node */

import { createBackupRetentionJobHandler } from '@/lib/jobs/backup-retention-job';

const request = {
  scope: 'scheduled' as const,
  environment: 'staging' as const,
  requestId: '750e8400-e29b-41d4-a716-446655440000',
  requestedAt: '2026-08-24T19:00:00.000Z',
};

it('completes only from the matching retention cleanup result', async () => {
  const submitRequest = jest.fn().mockResolvedValue(undefined);
  const readStatus = jest.fn()
    .mockResolvedValueOnce({
      requestId: '850e8400-e29b-41d4-a716-446655440000',
      environment: 'staging',
      status: 'COMPLETED',
      diagnosticCode: 'RETENTION_COMPLETED',
      retainedCount: 8,
      removedCount: 3,
    })
    .mockResolvedValueOnce({
      requestId: request.requestId,
      environment: 'staging',
      status: 'RUNNING',
      diagnosticCode: 'RETENTION_RUNNING',
      retainedCount: null,
      removedCount: null,
    })
    .mockResolvedValueOnce({
      requestId: request.requestId,
      environment: 'staging',
      status: 'COMPLETED',
      diagnosticCode: 'RETENTION_COMPLETED',
      retainedCount: 9,
      removedCount: 2,
    });
  const handler = createBackupRetentionJobHandler({
    submitRequest,
    readStatus,
    wait: jest.fn().mockResolvedValue(undefined),
    maxPolls: 3,
  });

  await expect(handler(request, {
    reportProgress: jest.fn().mockResolvedValue(undefined),
  })).resolves.toEqual({
    cleanupRequestId: request.requestId,
    status: 'COMPLETED',
    environment: 'staging',
    retainedCount: 9,
    removedCount: 2,
  });
  expect(submitRequest).toHaveBeenCalledWith({
    schemaVersion: 1,
    requestId: request.requestId,
    requestedAt: request.requestedAt,
    environment: 'staging',
  });
});
