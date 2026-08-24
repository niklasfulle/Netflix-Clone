import { randomUUID } from 'node:crypto';

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import type { MediaHealthQuery } from '@/lib/administration/media-health';
import { currentUser } from '@/lib/auth';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { mediaHealthReader } from '@/lib/media-health';
import { logBackendAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTENT_ID = /^[A-Za-z0-9_-]{1,191}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,128}$/;

function privateJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function enumValue<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && allowed.includes(value as T) ? value as T : undefined;
}

function queryFrom(request: Request): MediaHealthQuery {
  const params = new URL(request.url).searchParams;
  return {
    severity: enumValue(params.get('severity'), ['INFO', 'WARNING', 'CRITICAL']),
    resourceKind: enumValue(params.get('resourceKind'), ['VIDEO', 'THUMBNAIL']),
    contentType: enumValue(params.get('contentType'), ['Movie', 'Serie']),
    scanStatus: enumValue(params.get('scanStatus'), ['RUNNING', 'COMPLETED', 'FAILED']),
  };
}

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return privateJson({ error: 'Forbidden' }, 403);

  try {
    return privateJson(await mediaHealthReader.read(queryFrom(request)));
  } catch (error) {
    logBackendAction('admin_media_health_read_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Unable to load media health.' }, 500);
  }
}

async function requestContentId(request: Request): Promise<string | undefined | null> {
  try {
    const body = await request.json() as { contentId?: unknown };
    if (body.contentId === undefined || body.contentId === null || body.contentId === '') return undefined;
    return typeof body.contentId === 'string' && CONTENT_ID.test(body.contentId)
      ? body.contentId
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('media.scan');
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    await audit.denied();
    return privateJson({ error: 'Forbidden', correlationId: audit.correlationId }, 403);
  }

  const contentId = await requestContentId(request);
  const scope = contentId ? 'CONTENT' : 'CATALOG';
  if (contentId === null) {
    await audit.failed({ metadata: { scope: 'CONTENT', itemCount: 0 } });
    return privateJson({ error: 'Invalid content ID.', correlationId: audit.correlationId }, 400);
  }

  const suppliedIdempotencyKey = request.headers.get('idempotency-key');
  if (suppliedIdempotencyKey && !IDEMPOTENCY_KEY.test(suppliedIdempotencyKey)) {
    await audit.failed({ metadata: { scope, itemCount: 0 } });
    return privateJson({ error: 'Invalid idempotency key.', correlationId: audit.correlationId }, 400);
  }
  const idempotencyKey = suppliedIdempotencyKey ?? randomUUID();

  try {
    const result = await backgroundJobSubmission.submit(contentId ? {
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'content', contentId },
      actor: { userId: user.id, role: 'ADMIN' },
      target: { type: 'content', id: contentId },
      idempotencyKey,
      correlationId: audit.correlationId,
    } : {
      name: 'media.integrity.scan',
      version: 1,
      payload: { scope: 'catalog' },
      actor: { userId: user.id, role: 'ADMIN' },
      target: { type: 'catalog', id: 'published' },
      idempotencyKey,
      correlationId: audit.correlationId,
    });
    await audit.succeeded({
      target: { type: 'background_job', id: result.id },
      metadata: { scope, itemCount: 0 },
    });
    return privateJson({
      jobRunId: result.id,
      queueJobId: result.queueJobId,
      status: result.status,
      duplicate: result.duplicate,
      correlationId: audit.correlationId,
    }, result.duplicate ? 200 : 202);
  } catch (error) {
    await audit.failed({ metadata: { scope, itemCount: 0 } });
    logBackendAction('admin_media_scan_enqueue_failed', {
      correlationId: audit.correlationId,
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Unable to queue media scan.', correlationId: audit.correlationId }, 503);
  }
}
