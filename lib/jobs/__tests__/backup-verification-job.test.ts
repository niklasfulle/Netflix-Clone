/** @jest-environment node */

import { createBackupVerificationJobHandler } from '@/lib/jobs/backup-verification-job';

const request = {
  scope: 'latest' as const,
  requestId: '550e8400-e29b-41d4-a716-446655440000',
  requestedAt: '2026-08-24T18:00:00.000Z',
};

it('completes only after the matching backup verification is verified', async () => {
  const submitRequest = jest.fn().mockResolvedValue(undefined);
  const readStatus = jest.fn()
    .mockResolvedValueOnce({
      requestId: '650e8400-e29b-41d4-a716-446655440000',
      status: 'VERIFIED',
      diagnosticCode: 'VERIFICATION_SUCCEEDED',
      backupName: 'older-backup.dump',
    })
    .mockResolvedValueOnce({
      requestId: request.requestId,
      status: 'RUNNING',
      diagnosticCode: 'VERIFICATION_RUNNING',
      backupName: 'scheduled-staging-20260824T031500Z.dump',
    })
    .mockResolvedValueOnce({
      requestId: request.requestId,
      status: 'VERIFIED',
      diagnosticCode: 'VERIFICATION_SUCCEEDED',
      backupName: 'scheduled-staging-20260824T031500Z.dump',
    });
  const handler = createBackupVerificationJobHandler({
    submitRequest,
    readStatus,
    wait: jest.fn().mockResolvedValue(undefined),
    maxPolls: 3,
  });

  await expect(handler(request, {
    reportProgress: jest.fn().mockResolvedValue(undefined),
  })).resolves.toEqual({
    verificationRequestId: request.requestId,
    status: 'VERIFIED',
    diagnosticCode: 'VERIFICATION_SUCCEEDED',
    backupName: 'scheduled-staging-20260824T031500Z.dump',
  });
  expect(submitRequest).toHaveBeenCalledWith({
    schemaVersion: 1,
    requestId: request.requestId,
    requestedAt: request.requestedAt,
  });
});
