'use server';

import { currentUser } from '@/lib/auth';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';
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
  const attempt = authenticationTelemetry.start({
    flow: 'session_revocation',
    component: 'authentication.action',
  });
  try {
    const user = await currentUser();
    if (!user?.id) {
      attempt.complete({
        stage: 'session',
        outcome: 'rejected',
        reasonCode: 'unauthorized',
        retryable: false,
        errorCategory: 'credentials',
      });
      return { status: 'rejected' as const, code: 'unauthorized' as const };
    }
    if (!user.sessionId) {
      attempt.complete({
        stage: 'session',
        outcome: 'rejected',
        reasonCode: 'session_unavailable',
        retryable: false,
        errorCategory: 'credentials',
      });
      return { status: 'rejected' as const, code: 'session_unavailable' as const };
    }

    const result = await sessionSecurity.revokeOtherSessions({
      userId: user.id,
      currentSessionId: user.sessionId,
      context: await currentSecurityContext(),
    });
    attempt.complete({
      stage: 'session',
      outcome: 'success',
      reasonCode: 'other_sessions_revoked',
      retryable: false,
    });
    return {
      status: 'success' as const,
      code: 'other_sessions_revoked' as const,
      revoked: result.revoked,
    };
  } catch (error) {
    attempt.complete({
      stage: 'session',
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      retryable: true,
      errorCategory: 'database',
    });
    throw error;
  }
}
