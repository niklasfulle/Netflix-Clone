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
import { consumeAuthAttempt } from '@/lib/auth-throttle';

const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

const enforceThrottle = async (scope: 'login' | 'verification-resend' | 'two-factor', account: string) => {
  const result = await consumeAuthAttempt(scope, account);
  if (result.allowed) return null;
  logBackendAction('auth_rate_limited', {
    scope,
    keyHash: result.keyHash,
    retryAfterSeconds: result.retryAfterSeconds,
  }, 'warn');
  return { error: RATE_LIMIT_MESSAGE };
};

const handleUnverifiedEmail = async (email: string) => {
  const verificationToken = await generateVerificationToken(email)
  await sendVerificationEmail(verificationToken.email, verificationToken.token)
  logBackendAction('login_confirmation_sent', { email }, 'info');
  return { success: "Confirmation email sent!" }
}

const verifyTwoFactorCode = async (code: string, email: string, userId: string) => {
  const twoFactorToken = await getTwoFactorTokenByEmail(email)

  if (twoFactorToken?.token !== code) {
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

  const existingConfirmation = await getTwoFactorConfirmationByUserId(userId)

  if (existingConfirmation) {
    await db.twoFactorConfirmation.delete({
      where: { id: existingConfirmation.id }
    })
  }

  await db.twoFactorConfirmation.create({
    data: {
      userId: userId
    }
  })

  return null
}

const sendTwoFactorCode = async (email: string) => {
  const twoFactorToken = await generateTwoFactorToken(email)
  await sendTwoFactorEmail(twoFactorToken.email, twoFactorToken.token)
  logBackendAction('login_two_factor_sent', { email }, 'info');
  return { twoFactor: true }
}

const handleTwoFactor = async (code: string | undefined, email: string, userId: string) => {
  if (code) {
    return await verifyTwoFactorCode(code, email, userId)
  }
  return await sendTwoFactorCode(email)
}

const enforceTwoFactorThrottle = async (code: string | undefined, email: string) => {
  if (!code) return null;
  return enforceThrottle('two-factor', email);
}

const handleAuthError = (error: unknown, email: string) => {
  if (error instanceof AuthError) {
    if (error.type == "CredentialsSignin") {
      logBackendAction('login_invalid_credentials', { email }, 'error');
      return { error: "Invalid credentials!" }
    }
    logBackendAction('login_auth_error', { email, error: String(error) }, 'error');
    return { error: "Something went wrong!" }
  }
  logBackendAction('login_unknown_error', { email, error: String(error) }, 'error');
  throw error
}

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedField = LoginSchema.safeParse(values);

  if (!validatedField.success) {
    logBackendAction('login_invalid_fields', {
      invalidFields: validatedField.error.issues.map((issue) => issue.path.join('.')),
    }, 'error');
    return { error: "Invalid fields!" }
  }

  const { email, password, code } = validatedField.data

  const loginLimit = await enforceThrottle('login', email);
  if (loginLimit) return loginLimit;

  const existingUser = await getUserByEmail(email)

  if (!existingUser?.email || !existingUser.hashedPassword) {
    logBackendAction('login_invalid_credentials', { email }, 'error');
    return { error: "Invalid credentials!" }
  }

  if (!existingUser.emailVerified) {
    const resendLimit = await enforceThrottle('verification-resend', email);
    if (resendLimit) return resendLimit;
    return await handleUnverifiedEmail(email)
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    const twoFactorLimit = await enforceTwoFactorThrottle(code, email);
    if (twoFactorLimit) return twoFactorLimit;
    const twoFactorResult = await handleTwoFactor(code, existingUser.email, existingUser.id)
    if (twoFactorResult) {
      return twoFactorResult
    }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT })
  } catch (error) {
    return handleAuthError(error, email)
  }
  logBackendAction('login_success', { email }, 'info');
}
