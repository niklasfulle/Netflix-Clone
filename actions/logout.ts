'use server';

import { signOut } from '@/auth';
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';

export const logout = async () => {
  const attempt = authenticationTelemetry.start({
    flow: 'logout',
    component: 'authentication.action',
  });
  try {
    await signOut({ redirectTo: '/auth/login' });
    attempt.complete({
      stage: 'session',
      outcome: 'success',
      reasonCode: 'signed_out',
      retryable: false,
    });
  } catch (error) {
    attempt.complete({
      stage: 'session',
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      retryable: true,
      errorCategory: 'provider',
    });
    throw error;
  }
};
