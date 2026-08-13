'use server';

import { authenticationService } from '@/lib/authentication/production';

export async function resendVerificationEmail(values: { email: string }) {
  return authenticationService.resendVerification(values);
}
