"use server"
import { logBackendAction } from '@/lib/logger';
import { AuthError } from 'next-auth';
import * as z from 'zod';

import { signIn } from '@/auth';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendTwoFactorEmail, sendVerificationEmail } from '@/lib/mail';
import { generateTwoFactorToken, generateVerificationToken } from '@/lib/tokens';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema } from '@/schemas';

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedField = LoginSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('login_invalid_fields', { values }, 'error');
    return { error: "Invalid fields!" }
  }

  const { email, password, code } = validatedField.data

  const existingUser = await getUserByEmail(email)

  if (!existingUser?.email || !existingUser.hashedPassword) {
    logBackendAction('login_email_not_exist', { email }, 'error');
    return { error: "Email does not exist!" }
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(verificationToken.email, verificationToken.token)
    logBackendAction('login_confirmation_sent', { email }, 'info');
    return { success: "Confirmation email sent!" }
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email)

      if (!twoFactorToken || twoFactorToken.token !== code) {
        logBackendAction('login_invalid_code', { email }, 'error');
        return { error: "Invalid code!" }
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date()

      if (hasExpired) {
        logBackendAction('login_code_expired', { email }, 'error');
        return { error: "Code has expired!" }
      }

      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id }
      })

      const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id)


      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id }
        })
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id
        }
      })

    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorEmail(
        twoFactorToken.email,
        twoFactorToken.token
      )

      logBackendAction('login_two_factor_sent', { email }, 'info');
      return { twoFactor: true }
    }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type == "CredentialsSignin") {
        logBackendAction('login_invalid_credentials', { email }, 'error');
        return { error: "Invalid credentials!" }
      }
      else {
        logBackendAction('login_auth_error', { email, error: String(error) }, 'error');
        return { error: "Something went wrong!" }
      }
    }
    logBackendAction('login_unknown_error', { email, error: String(error) }, 'error');
    throw error
  }
  logBackendAction('login_success', { email }, 'info');
}