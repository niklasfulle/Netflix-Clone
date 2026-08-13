import crypto from 'node:crypto';

import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getVerificationTokenByEmail } from '@/data/verification-token';
import { db } from '@/lib/db';
import {
  createOpaqueOneTimeToken,
  hashOneTimeToken,
} from '@/lib/authentication/token-crypto';

export const generateVerificationToken = async (
  email: string,
  binding: { userId?: string; targetEmail?: string } = {},
) => {
  const token = createOpaqueOneTimeToken()
  const expires = new Date(Date.now() + 3600 * 1000)

  const existingToken = await getVerificationTokenByEmail(email)

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  await db.verificationToken.create({
    data: {
      email,
      tokenHash: hashOneTimeToken('verification', token),
      expires,
      userId: binding.userId,
      targetEmail: binding.targetEmail,
    }
  })

  return { email, token, expires }
}

export const generatePasswordResetToken = async (email: string, userId?: string) => {
  const token = createOpaqueOneTimeToken()
  const expires = new Date(Date.now() + 3600 * 1000)

  const existingToken = await getPasswordResetTokenByEmail(email)

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  await db.passwordResetToken.create({
    data: {
      email,
      tokenHash: hashOneTimeToken('password-reset', token),
      expires,
      userId,
    }
  })

  return { email, token, expires }
}

export const generateTwoFactorToken = async (email: string, userId?: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString()
  const expires = new Date(Date.now() + 900 * 1000)

  const existingToken = await getTwoFactorTokenByEmail(email)

  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id
      }
    })
  }

  await db.twoFactorToken.create({
    data: {
      email,
      tokenHash: hashOneTimeToken('two-factor', token),
      expires,
      userId,
    }
  })

  return { email, token, expires }
}
