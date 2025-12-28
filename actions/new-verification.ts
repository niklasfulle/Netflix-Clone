"use server"
import { logBackendAction } from '@/lib/logger';
import { getUserByEmail } from '@/data/user';
import { getVerificationTokenByToken } from '@/data/verification-token';
import { db } from '@/lib/db';

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token)

  if (!existingToken) {
    logBackendAction('newVerification_token_not_exist', { token }, 'error');
    return { error: "Token does not exist!" }
  }

  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    logBackendAction('newVerification_token_expired', { token }, 'error');
    return { error: "Token has expired!" }
  }

  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    logBackendAction('newVerification_email_not_exist', { email: existingToken.email }, 'error');
    return { error: "Email dows not exist!" }
  }
  logBackendAction('newVerification_success', { email: existingToken.email }, 'info');

  await db.user.update({
    where: {
      id: existingUser.id
    },
    data: {
      emailVerified: new Date(),
      email: existingToken.email
    }
  })

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  })

  return { succes: "Email verified!" }
}