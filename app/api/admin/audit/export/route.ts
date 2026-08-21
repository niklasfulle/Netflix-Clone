import { NextResponse } from 'next/server';

import { adminAuditReader } from '@/lib/admin-audit-reader';
import { createAdminAuditCsv } from '@/lib/administration/admin-audit-csv';
import { AdminAuditReadAuthorizationError } from '@/lib/administration/admin-audit-reader';
import { adminAuditSearchInput } from '@/lib/administration/admin-audit-search-input';
import { logBackendAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const AUDIT_EXPORT_LIMIT = 100;

function textResponse(body: string, status: number, headers: Record<string, string> = {}) {
  return new NextResponse(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', ...headers },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = adminAuditSearchInput(searchParams, {
      page: '1',
      pageSize: String(AUDIT_EXPORT_LIMIT),
    });
    const result = await adminAuditReader.search(input);
    const date = new Date().toISOString().slice(0, 10);
    return textResponse(createAdminAuditCsv(result.events), 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="admin-audit-${date}.csv"`,
      'X-Export-Limit': String(AUDIT_EXPORT_LIMIT),
      'X-Export-Truncated': String(result.total > result.events.length),
    });
  } catch (error) {
    if (error instanceof AdminAuditReadAuthorizationError) {
      return textResponse('Forbidden', 403);
    }
    logBackendAction('admin_audit_export_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    }, 'error');
    return textResponse('Unable to export audit events.', 500);
  }
}
