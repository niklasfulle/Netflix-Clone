'use server';

import { currentUser } from '@/lib/auth';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';

export async function getSecurityActivity() {
  const user = await currentUser();
  if (!user?.id) return { status: 'rejected' as const, code: 'unauthorized' as const };

  const activity = await sessionSecurity.getRecentActivity(user.id);
  return {
    status: 'success' as const,
    activity: activity.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function revokeOtherSessions() {
  const user = await currentUser();
  if (!user?.id) return { status: 'rejected' as const, code: 'unauthorized' as const };
  if (!user.sessionId) {
    return { status: 'rejected' as const, code: 'session_unavailable' as const };
  }

  const result = await sessionSecurity.revokeOtherSessions({
    userId: user.id,
    currentSessionId: user.sessionId,
    context: await currentSecurityContext(),
  });
  return {
    status: 'success' as const,
    code: 'other_sessions_revoked' as const,
    revoked: result.revoked,
  };
}
