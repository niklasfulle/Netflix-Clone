import { logBackendAction } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    logBackendAction('api_current_user_no_user', {}, 'error');
    return NextResponse.json(null, { status: 404 });
  }
  logBackendAction('api_current_user_success', { userId: user.id }, 'info');
  return NextResponse.json(user);
}
