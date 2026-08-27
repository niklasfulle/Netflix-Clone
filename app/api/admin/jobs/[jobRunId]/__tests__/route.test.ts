/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({
  adminMutationAudit: { begin: jest.fn() },
}));
jest.mock('@/lib/jobs/runtime', () => ({
  backgroundJobControl: { get: jest.fn(), cancel: jest.fn() },
  backgroundJobRetry: { retry: jest.fn() },
}));

import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { backgroundJobControl, backgroundJobRetry } from '@/lib/jobs/runtime';
import { DELETE, GET, POST } from '../route';

const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedGet = backgroundJobControl.get as jest.MockedFunction<typeof backgroundJobControl.get>;
const mockedCancel = backgroundJobControl.cancel as jest.MockedFunction<typeof backgroundJobControl.cancel>;
const mockedRetry = backgroundJobRetry.retry as jest.MockedFunction<typeof backgroundJobRetry.retry>;
const mockedBeginAudit = adminMutationAudit.begin as jest.MockedFunction<typeof adminMutationAudit.begin>;

const context = { params: Promise.resolve({ jobRunId: 'job-run-123' }) };
const statusView = {
  id: 'job-run-123',
  jobType: 'media.integrity.scan',
  queueJobId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'RUNNING' as const,
  progress: 20,
  progressMessage: 'Scanning catalog media',
  attemptCount: 1,
  result: null,
  errorCode: null,
  errorMessage: null,
  correlationId: 'request-correlation-123',
  acceptedAt: new Date('2026-08-23T10:00:00.000Z'),
  startedAt: new Date('2026-08-23T10:01:00.000Z'),
  completedAt: null,
  cancelRequestedAt: null,
};

function auditAttempt() {
  return {
    correlationId: 'cancel-correlation-123',
    succeeded: jest.fn().mockResolvedValue(undefined),
    denied: jest.fn().mockResolvedValue(undefined),
    failed: jest.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockedCurrentUser.mockResolvedValue({ id: 'admin-user-123', role: 'ADMIN' } as Awaited<ReturnType<typeof currentUser>>);
});

it('returns durable job progress to administrators without caching it', async () => {
  mockedGet.mockResolvedValue(statusView);

  const response = await GET(new Request('http://localhost/api/admin/jobs/job-run-123'), context);

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toMatchObject({ id: 'job-run-123', status: 'RUNNING', progress: 20 });
});

it('rejects job status access by a non-administrator', async () => {
  mockedCurrentUser.mockResolvedValue({ id: 'regular-user-123', role: 'USER' } as Awaited<ReturnType<typeof currentUser>>);

  const response = await GET(new Request('http://localhost/api/admin/jobs/job-run-123'), context);

  expect(response.status).toBe(403);
  expect(mockedGet).not.toHaveBeenCalled();
});

it('requests cancellation and records the administrator mutation', async () => {
  const audit = auditAttempt();
  mockedBeginAudit.mockReturnValue(audit);
  mockedCancel.mockResolvedValue({ ...statusView, status: 'CANCEL_REQUESTED', cancelRequestedAt: new Date() });

  const response = await DELETE(new Request('http://localhost/api/admin/jobs/job-run-123', { method: 'DELETE' }), context);

  expect(response.status).toBe(202);
  expect(await response.json()).toMatchObject({ id: 'job-run-123', status: 'CANCEL_REQUESTED' });
  expect(audit.succeeded).toHaveBeenCalledWith({
    target: { type: 'background_job', id: 'job-run-123' },
    metadata: { status: 'CANCEL_REQUESTED' },
  });
});

it('retries failed work and records an idempotent administrator mutation', async () => {
  const audit = auditAttempt();
  mockedBeginAudit.mockReturnValue(audit);
  mockedRetry.mockResolvedValue({
    id: 'job-run-123',
    queueJobId: 'new-queue-job-id',
    status: 'QUEUED',
    duplicate: false,
  } as Awaited<ReturnType<typeof backgroundJobRetry.retry>>);

  const response = await POST(new Request('http://localhost/api/admin/jobs/job-run-123', {
    method: 'POST',
  }), context);

  expect(response.status).toBe(202);
  expect(await response.json()).toMatchObject({ status: 'QUEUED', duplicate: false });
  expect(audit.succeeded).toHaveBeenCalledWith({
    target: { type: 'background_job', id: 'job-run-123' },
    metadata: { status: 'QUEUED', duplicate: false },
  });
});
