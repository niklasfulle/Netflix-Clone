import { randomUUID } from 'node:crypto';

import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { currentUser } from '@/lib/auth';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';

export const runtime = 'nodejs';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,128}$/;
const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('backup.cleanup');
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    await audit.denied();
    return Response.json({ error: 'Forbidden', correlationId: audit.correlationId }, {
      status: 403,
      headers: noStoreHeaders,
    });
  }

  const environment = process.env.DEPLOYMENT_ENVIRONMENT;
  if (environment !== 'staging' && environment !== 'production') {
    await audit.failed();
    return Response.json({ error: 'Backup retention is unavailable.' }, {
      status: 503,
      headers: noStoreHeaders,
    });
  }
  const suppliedIdempotencyKey = request.headers.get('idempotency-key');
  if (suppliedIdempotencyKey && !IDEMPOTENCY_KEY.test(suppliedIdempotencyKey)) {
    await audit.failed({ metadata: { environment } });
    return Response.json({ error: 'Invalid idempotency key.' }, {
      status: 400,
      headers: noStoreHeaders,
    });
  }

  const requestId = randomUUID();
  const requestedAt = new Date().toISOString();
  try {
    const result = await backgroundJobSubmission.submit({
      name: 'backup.retention.cleanup',
      version: 1,
      payload: { scope: 'scheduled', environment, requestId, requestedAt },
      actor: { userId: user.id, role: 'ADMIN' },
      target: { type: 'backup_retention', id: environment },
      idempotencyKey: suppliedIdempotencyKey ?? requestId,
      correlationId: audit.correlationId,
    });
    await audit.succeeded({
      target: { type: 'background_job', id: result.id },
      metadata: { environment },
    });
    return Response.json({
      jobRunId: result.id,
      queueJobId: result.queueJobId,
      status: result.status,
      duplicate: result.duplicate,
      correlationId: audit.correlationId,
    }, {
      status: result.duplicate ? 200 : 202,
      headers: noStoreHeaders,
    });
  } catch {
    await audit.failed({ metadata: { environment } });
    return Response.json({
      error: 'Backup retention cleanup could not be queued.',
      correlationId: audit.correlationId,
    }, { status: 503, headers: noStoreHeaders });
  }
}
