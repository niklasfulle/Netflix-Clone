import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { JobRunNotFoundError } from '@/lib/jobs/control';
import { JobRetryNotAllowedError } from '@/lib/jobs/retry';
import { backgroundJobControl, backgroundJobRetry } from '@/lib/jobs/runtime';
import { logBackendAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JOB_RUN_ID = /^[A-Za-z0-9_-]{8,128}$/;

function privateJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

async function adminActor() {
  const user = await currentUser();
  return user?.role === 'ADMIN' && user.id
    ? { userId: user.id, role: 'ADMIN' as const }
    : null;
}

async function requestedJobRunId(context: { params: Promise<{ jobRunId: string }> }) {
  const { jobRunId } = await context.params;
  return JOB_RUN_ID.test(jobRunId) ? jobRunId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobRunId: string }> },
) {
  const actor = await adminActor();
  if (!actor) return privateJson({ error: 'Forbidden' }, 403);
  const jobRunId = await requestedJobRunId(context);
  if (!jobRunId) return privateJson({ error: 'Not found' }, 404);

  try {
    return privateJson(await backgroundJobControl.get(jobRunId, actor));
  } catch (error) {
    if (error instanceof JobRunNotFoundError) return privateJson({ error: 'Not found' }, 404);
    logBackendAction('admin_background_job_read_failed', {
      jobRunId,
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Unable to load background job.' }, 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ jobRunId: string }> },
) {
  const audit = adminMutationAudit.begin('job.cancel');
  const actor = await adminActor();
  if (!actor) {
    await audit.denied();
    return privateJson({ error: 'Forbidden', correlationId: audit.correlationId }, 403);
  }
  const jobRunId = await requestedJobRunId(context);
  if (!jobRunId) {
    await audit.failed();
    return privateJson({ error: 'Not found', correlationId: audit.correlationId }, 404);
  }

  try {
    const result = await backgroundJobControl.cancel(jobRunId, actor);
    await audit.succeeded({
      target: { type: 'background_job', id: jobRunId },
      metadata: { status: result.status },
    });
    return privateJson(result, result.status === 'CANCEL_REQUESTED' ? 202 : 200);
  } catch (error) {
    await audit.failed({ target: { type: 'background_job', id: jobRunId } });
    if (error instanceof JobRunNotFoundError) {
      return privateJson({ error: 'Not found', correlationId: audit.correlationId }, 404);
    }
    logBackendAction('admin_background_job_cancel_failed', {
      jobRunId,
      correlationId: audit.correlationId,
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Unable to cancel background job.', correlationId: audit.correlationId }, 503);
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobRunId: string }> },
) {
  const audit = adminMutationAudit.begin('job.retry');
  const actor = await adminActor();
  if (!actor) {
    await audit.denied();
    return privateJson({ error: 'Forbidden', correlationId: audit.correlationId }, 403);
  }
  const jobRunId = await requestedJobRunId(context);
  if (!jobRunId) {
    await audit.failed();
    return privateJson({ error: 'Not found', correlationId: audit.correlationId }, 404);
  }

  try {
    const result = await backgroundJobRetry.retry(jobRunId, actor);
    await audit.succeeded({
      target: { type: 'background_job', id: jobRunId },
      metadata: { status: result.status, duplicate: result.duplicate },
    });
    return privateJson(result, 202);
  } catch (error) {
    await audit.failed({ target: { type: 'background_job', id: jobRunId } });
    if (error instanceof JobRunNotFoundError) {
      return privateJson({ error: 'Not found', correlationId: audit.correlationId }, 404);
    }
    if (error instanceof JobRetryNotAllowedError) {
      return privateJson({
        error: 'Background job cannot be retried from its current state.',
        correlationId: audit.correlationId,
      }, 409);
    }
    logBackendAction('admin_background_job_retry_failed', {
      jobRunId,
      correlationId: audit.correlationId,
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({
      error: 'Unable to retry background job.',
      correlationId: audit.correlationId,
    }, 503);
  }
}
