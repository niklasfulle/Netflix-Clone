"use server"
import { logBackendAction } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

import { getPasswordResetTokenByToken } from '@/data/password-reset-token';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { NewPasswordSchema } from '@/schemas';

export const setNewPassword = async (values: z.infer<typeof NewPasswordSchema>, token?: string | null) => {
  if (!token) {
    logBackendAction('newPassword_missing_token', {}, 'error');
    return { error: "Missing token!" }
  }

  const validatedField = NewPasswordSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('newPassword_invalid_password', { values }, 'error');
    return { error: "Invalid password!" }
  }

  const { password } = validatedField.data

  const existingToken = await getPasswordResetTokenByToken(token)

  if (!existingToken) {
    logBackendAction('newPassword_token_not_exist', { token }, 'error');
    return { error: "Token does not exist!" }
  }

  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    logBackendAction('newPassword_token_expired', { token }, 'error');
    return { error: "Token has expired!" }
  }

  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    logBackendAction('newPassword_email_not_exist', { email: existingToken.email }, 'error');
    return { error: "Email does not exist!" }
  }
  logBackendAction('newPassword_success', { email: existingToken.email }, 'info');

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      hashedPassword: hashedPassword
    }
  })

  await db.passwordResetToken.delete({
    where: { id: existingToken.id }
  })

  return { success: "New password set!" }
}