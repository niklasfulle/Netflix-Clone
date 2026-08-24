/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn() },
}));
jest.mock('@/lib/jobs/runtime', () => ({
  backgroundJobSubmission: { submit: jest.fn() },
}));

import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { POST } from '../route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedSubmit = backgroundJobSubmission.submit as jest.MockedFunction<
  typeof backgroundJobSubmission.submit
>;
const mockedBeginAudit = adminMutationAudit.begin as jest.MockedFunction<
  typeof adminMutationAudit.begin
>;

it('queues retention only for the server deployment environment', async () => {
  const previousEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;
  process.env.DEPLOYMENT_ENVIRONMENT = 'staging';
  const audit = {
    correlationId: 'request-correlation-123',
    succeeded: jest.fn().mockResolvedValue(undefined),
    denied: jest.fn().mockResolvedValue(undefined),
    failed: jest.fn().mockResolvedValue(undefined),
  };
  mockedBeginAudit.mockReturnValue(audit);
  mockedCurrentUser.mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' } as never);
  mockedSubmit.mockResolvedValue({
    id: 'retention-job-run-123',
    queueJobId: '850e8400-e29b-41d4-a716-446655440000',
    status: 'QUEUED',
    duplicate: false,
    correlationId: 'request-correlation-123',
  });

  try {
    const response = await POST(new Request('http://localhost/api/admin/backups/retention', {
      method: 'POST',
      headers: { 'idempotency-key': 'retention-retry-key-123' },
    }));

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      jobRunId: 'retention-job-run-123',
      status: 'QUEUED',
    });
    expect(mockedSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'backup.retention.cleanup',
      payload: expect.objectContaining({ environment: 'staging', scope: 'scheduled' }),
      target: { type: 'backup_retention', id: 'staging' },
      idempotencyKey: 'retention-retry-key-123',
    }));
    expect(audit.succeeded).toHaveBeenCalledWith({
      target: { type: 'background_job', id: 'retention-job-run-123' },
      metadata: { environment: 'staging' },
    });
  } finally {
    if (previousEnvironment === undefined) delete process.env.DEPLOYMENT_ENVIRONMENT;
    else process.env.DEPLOYMENT_ENVIRONMENT = previousEnvironment;
  }
});
