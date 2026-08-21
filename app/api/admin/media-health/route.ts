import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { MediaScanAlreadyRunningError } from '@/lib/administration/media-integrity-scanner';
import type { MediaHealthQuery } from '@/lib/administration/media-health';
import { mediaHealthReader } from '@/lib/media-health';
import { mediaIntegrityScanner } from '@/lib/media-integrity';
import { logBackendAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTENT_ID = /^[A-Za-z0-9_-]{1,191}$/;

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
  if (!(await isCurrentUserAdmin())) {
    await audit.denied();
    return privateJson({ error: 'Forbidden', correlationId: audit.correlationId }, 403);
  }

  const contentId = await requestContentId(request);
  const scope = contentId ? 'CONTENT' : 'CATALOG';
  if (contentId === null) {
    await audit.failed({ metadata: { scope: 'CONTENT', itemCount: 0 } });
    return privateJson({ error: 'Invalid content ID.', correlationId: audit.correlationId }, 400);
  }

  try {
    const result = await mediaIntegrityScanner.scan(contentId ? { contentId } : {});
    await audit.succeeded({
      target: { type: 'media_scan', id: result.id },
      metadata: { scope: result.scope, itemCount: result.contentCount },
    });
    return privateJson({ ...result, correlationId: audit.correlationId }, 201);
  } catch (error) {
    await audit.failed({ metadata: { scope, itemCount: 0 } });
    if (error instanceof MediaScanAlreadyRunningError) {
      return privateJson({
        error: 'A matching media scan is already running.',
        correlationId: audit.correlationId,
      }, 409);
    }
    logBackendAction('admin_media_scan_failed', {
      correlationId: audit.correlationId,
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Media scan failed.', correlationId: audit.correlationId }, 500);
  }
}
