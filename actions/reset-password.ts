"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { sendResetPasswordEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';
import { ResetPasswordSchema } from '@/schemas';
import { consumeAuthAttempt } from '@/lib/auth-throttle';

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) => {
  const validatedField = ResetPasswordSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('resetPassword_invalid_email', {
      invalidFields: (validatedField.error?.issues ?? []).map((issue) => issue.path.join('.')),
    }, 'error');
    return { error: "Invalid email!" }
  }

  const { email } = validatedField.data

  const throttle = await consumeAuthAttempt('password-reset', email);
  if (!throttle.allowed) {
    logBackendAction('auth_rate_limited', {
      scope: 'password-reset',
      keyHash: throttle.keyHash,
      retryAfterSeconds: throttle.retryAfterSeconds,
    }, 'warn');
    return { error: "Too many attempts. Please try again later." }
  }

  const existingUser = await getUserByEmail(email)

  if (!existingUser) {
    logBackendAction('resetPassword_request_accepted', { email }, 'info');
    return { success: "Reset email sent!" }
  }
  logBackendAction('resetPassword_success', { email }, 'info');

  const passwordResetToken = await generatePasswordResetToken(email)
  await sendResetPasswordEmail(passwordResetToken.email, passwordResetToken.token)

  return { success: "Reset email sent!" }
}
