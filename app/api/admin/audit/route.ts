import { NextResponse } from 'next/server';

import { adminAuditReader } from '@/lib/admin-audit-reader';
import { AdminAuditReadAuthorizationError } from '@/lib/administration/admin-audit-reader';
import { adminAuditSearchInput } from '@/lib/administration/admin-audit-search-input';
import { logBackendAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const AUDIT_RETENTION_DAYS = 365;

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await adminAuditReader.search(adminAuditSearchInput(searchParams));
    return privateJson({ ...result, retentionDays: AUDIT_RETENTION_DAYS });
  } catch (error) {
    if (error instanceof AdminAuditReadAuthorizationError) {
      return privateJson({ error: 'Forbidden' }, 403);
    }
    logBackendAction('admin_audit_read_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return privateJson({ error: 'Unable to load audit events.' }, 500);
  }
}
