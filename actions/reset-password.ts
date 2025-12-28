"use server"
import { logBackendAction } from '@/lib/logger';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { sendResetPasswordEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';
import { ResetPasswordSchema } from '@/schemas';

export const reset = async (values: z.infer<typeof ResetPasswordSchema>) => {
  const validatedField = ResetPasswordSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('resetPassword_invalid_email', { values }, 'error');
    return { error: "Invalid email!" }
  }

  const { email } = validatedField.data

  const existingUser = await getUserByEmail(email)

  if (!existingUser) {
    logBackendAction('resetPassword_email_not_exist', { email }, 'error');
    return { error: "Email does not exist!" }
  }
  logBackendAction('resetPassword_success', { email }, 'info');

  const passwordResetToken = await generatePasswordResetToken(email)
  await sendResetPasswordEmail(passwordResetToken.email, passwordResetToken.token)

  return { success: "Reset email sent!" }
}