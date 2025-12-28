import { logBackendAction } from '@/lib/logger';
import { NextResponse } from 'next/server';

import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const dynamic = "force-dynamic"

export async function GET() {
  const role = await currentRole();

  if (role === UserRole.ADMIN) {
    logBackendAction('api_admin_route_allowed', { role }, 'info');
    return new NextResponse(null, { status: 200 })
  }
  logBackendAction('api_admin_route_forbidden', { role }, 'error');
  return new NextResponse(null, { status: 403 })
}