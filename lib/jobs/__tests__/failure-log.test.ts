/** @jest-environment node */
jest.mock('@/lib/log-store', () => ({ backendLogStore: { write: jest.fn() } }));
import { backendLogStore } from '@/lib/log-store';
import { reportBackgroundJobFailure } from '../failure-log';
import { jobFailureDetails, jobFailureMessage, storedJobDiagnostic } from '../failure-diagnostics';

const input = {
  envelope: { jobRunId: 'job-123', correlationId: 'correlation-123', name: 'backup.creation.request', payload: { privateValue: 'not-for-logs' } },
  queueJobId: 'queue-123', attemptCount: 4, deadLetter: true,
  error: Object.assign(new Error('EACCES: permission denied /private/database hidden-detail'), { code: 'EACCES' }),
};
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => undefined); jest.mocked(backendLogStore.write).mockResolvedValue(undefined); });
afterEach(() => jest.restoreAllMocks());

it('writes a correlated failure to shared application logs and worker output without raw error or payload', async () => {
  await reportBackgroundJobFailure(input);
  expect(backendLogStore.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'background_job_failed', level: 'error', jobRunId: 'job-123', correlationId: 'correlation-123', jobType: 'backup.creation.request', attemptCount: 4, deadLetter: true, diagnostic: 'FILESYSTEM_ACCESS_DENIED' }));
  expect(console.error).toHaveBeenCalledWith('background_job_failed', expect.objectContaining({ correlationId: 'correlation-123' }));
  const output = JSON.stringify([jest.mocked(backendLogStore.write).mock.calls, jest.mocked(console.error).mock.calls]);
  expect(output).not.toContain('/private'); expect(output).not.toContain('hidden-detail'); expect(output).not.toContain('not-for-logs');
});

it('does not replace the job outcome when log storage fails', async () => {
  jest.mocked(backendLogStore.write).mockRejectedValue(new Error('unwritable'));
  await expect(reportBackgroundJobFailure(input)).resolves.toBeUndefined();
  expect(console.error).toHaveBeenCalledWith('background_job_log_write_failed', expect.objectContaining({ correlationId: 'correlation-123' }));
});

it('classifies historical lease failures and rejects unrecognized diagnostic values', () => {
  const error = new Error('Operational lease TTL must be between 5000 and 900000 milliseconds');
  expect(jobFailureDetails(error).errorCode).toBe('INVALID_LEASE_TTL');
  expect(storedJobDiagnostic('Error', error.message)).toBe('INVALID_LEASE_TTL');
  expect(jobFailureMessage('toString')).toBeUndefined();
  expect(jobFailureDetails(Object.assign(new Error('private details'), { diagnosticCode: 'PRIVATE_VALUE' })).errorCode).toBe('Error');
});
