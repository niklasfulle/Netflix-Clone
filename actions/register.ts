"use server"
import { logBackendAction } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { RegisterSchema } from '@/schemas';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedField = RegisterSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('register_invalid_fields', { values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { email, password, confirm, name } = validatedField.data
  if (password !== confirm) {
    logBackendAction('register_passwords_no_match', { email }, 'error');
    return { error: "Passwords don't match!" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    logBackendAction('register_email_in_use', { email }, 'error');
    return { error: "Email already in use!" }
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