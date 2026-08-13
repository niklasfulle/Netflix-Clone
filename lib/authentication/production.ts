import { signIn } from '@/auth';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { consumeAuthToken } from '@/data/auth-token';
import { consumeMfaChallenge, hasVerifiedMfaAuthenticator } from '@/data/mfa';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getUserByEmail, getUserById } from '@/data/user';
import { consumeAuthAttempt, releaseAuthAttempt } from '@/lib/auth-throttle';
import { db } from '@/lib/db';
import { logBackendAction } from '@/lib/logger';
import { sendResetPasswordEmail, sendTwoFactorEmail, sendVerificationEmail } from '@/lib/mail';
import {
  generatePasswordResetToken,
  generateTwoFactorToken,
  generateVerificationToken,
} from '@/lib/tokens';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { privacySafeAuthenticationContext } from './privacy';
import { createAuthenticationService } from './service';

const authenticationAuditSecret = process.env.AUTH_SECRET
  ?? process.env.NEXTAUTH_SECRET
  ?? 'development-auth-audit-secret';

export const authenticationService = createAuthenticationService({
  users: {
    findByEmail: async (email) => {
      const user = await getUserByEmail(email);
      if (!user) return null;
      return {
        ...user,
        hasVerifiedAuthenticator: await hasVerifiedMfaAuthenticator(user.id),
      };
    },
    findById: async (userId) => {
      const user = await getUserById(userId);
      if (!user) return null;
      return {
        ...user,
        hasVerifiedAuthenticator: await hasVerifiedMfaAuthenticator(user.id),
      };
    },
    create: async (account) => {
      try {
        const user = await db.user.create({ data: account });
        return { created: true as const, userId: user.id };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return { created: false as const };
        }
        throw error;
      }
    },
    updatePassword: async (userId, hashedPassword) => {
      await db.user.update({ where: { id: userId }, data: { hashedPassword } });
    },
    verifyEmail: async (userId, email, verifiedAt) => {
      try {
        await db.user.update({
          where: { id: userId },
          data: { email, emailVerified: verifiedAt },
        });
        return true;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return false;
        }
        throw error;
      }
    },
  },
  passwords: {
    hash: (password) => bcrypt.hash(password, 10),
    verify: (password, hashedPassword) => bcrypt.compare(password, hashedPassword),
  },
  throttle: {
    consume: consumeAuthAttempt,
    release: releaseAuthAttempt,
  },
  tokens: {
    issueVerification: generateVerificationToken,
    issuePasswordReset: generatePasswordResetToken,
    issueTwoFactor: generateTwoFactorToken,
    consumeTwoFactor: (email, token, now) =>
      consumeAuthToken('two-factor', token, now, email),
    consumePasswordReset: (token, now) =>
      consumeAuthToken('password-reset', token, now),
    consumeVerification: (token, now) =>
      consumeAuthToken('verification', token, now),
  },
  mail: {
    sendVerification: async ({ email, token }) => sendVerificationEmail(email, token),
    sendPasswordReset: async ({ email, token }) => sendResetPasswordEmail(email, token),
    sendTwoFactor: async ({ email, token }) => sendTwoFactorEmail(email, token),
  },
  session: {
    signInCredentials: async ({ email, password }) => {
      await signIn('credentials', { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT });
    },
    isRedirectError,
  },
  confirmations: {
    replaceForUser: async (userId) => {
      const existingConfirmation = await getTwoFactorConfirmationByUserId(userId);
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id },
        });
      }
      await db.twoFactorConfirmation.create({ data: { userId } });
    },
  },
  mfa: {
    consumeChallenge: consumeMfaChallenge,
  },
  security: {
    revokeAllSessions: async (userId, event) => {
      await sessionSecurity.revokeAllSessions({
        userId,
        event,
        context: await currentSecurityContext(),
      });
    },
  },
  audit: {
    log: (event, context, level) => {
      logBackendAction(
        event,
        privacySafeAuthenticationContext(context, authenticationAuditSecret),
        level,
      );
    },
  },
  clock: {
    now: () => new Date(),
  },
});
