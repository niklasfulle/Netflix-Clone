"use server"
import { logBackendAction } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { RegisterSchema } from '@/schemas';
import { consumeAuthAttempt } from '@/lib/auth-throttle';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedField = RegisterSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('register_invalid_fields', {
      invalidFields: validatedField.error.issues.map((issue) => issue.path.join('.')),
    }, 'error');
    return { error: "Invalid fields!" }
  }

  const { email, password, confirm, name } = validatedField.data

  const throttle = await consumeAuthAttempt('register', email);
  if (!throttle.allowed) {
    logBackendAction('auth_rate_limited', {
      scope: 'register',
      keyHash: throttle.keyHash,
      retryAfterSeconds: throttle.retryAfterSeconds,
    }, 'warn');
    return { error: "Too many attempts. Please try again later." }
  }
  if (password !== confirm) {
    logBackendAction('register_passwords_no_match', { email }, 'error');
    return { error: "Passwords don't match!" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    logBackendAction('register_email_in_use', { email }, 'error');
    return { success: "Confirmation email sent!" }
  }
  logBackendAction('register_success', { email }, 'info');

  await db.user.create({
    data: {
      name: name,
      email: email,
      hashedPassword: hashedPassword
    }
  })

  const verificationToken = await generateVerificationToken(email)

  await sendVerificationEmail(verificationToken.email, verificationToken.token)

  return { success: "Confirmation email sent!" }
}
