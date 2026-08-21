import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getUserById } from "@/data/user"
import { db } from "@/lib/db"
import authConfig from "./auth.config"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"
import { getAccountByUserId } from "./data/account"
import { hasActiveUserBlock } from "@/lib/user-access"
import { currentSecurityContext, sessionSecurity } from "@/lib/session-security"
import { applySessionIdentity } from "@/lib/authentication/session-user"
import { withPasskeyMetadata } from "@/lib/authentication/passkey-adapter"
import { passkeyMetadataRepository } from "@/data/passkeys"
import { hasCurrentPasskeyManagementGrant } from "@/lib/passkeys"
import { isPasskeySignInAllowed } from "@/lib/authentication/passkey-sign-in-policy"
import { authenticationTelemetry } from "@/lib/authentication/production-telemetry"
import { shouldObserveSessionValidation } from "@/lib/authentication/session-telemetry"

const adapter = withPasskeyMetadata(PrismaAdapter(db), passkeyMetadataRepository)

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    },
    async signOut(message) {
      const attempt = authenticationTelemetry.start({
        flow: 'session_lifecycle',
        component: 'authentication.callback',
      })
      const token = 'token' in message ? message.token : null
      try {
        if (!token?.sub || !token.sessionId) {
          attempt.complete({
            stage: 'session',
            outcome: 'rejected',
            reasonCode: 'session_unavailable',
            retryable: false,
          })
          return
        }
        await sessionSecurity.revokeCurrentSession({
          userId: token.sub,
          sessionId: token.sessionId,
          context: await currentSecurityContext(),
        })
        attempt.complete({
          stage: 'session',
          outcome: 'success',
          reasonCode: 'session_revoked',
          retryable: false,
        })
      } catch (error) {
        attempt.complete({
          stage: 'session',
          outcome: 'failed',
          reasonCode: 'unexpected_failure',
          retryable: true,
          errorCategory: 'database',
        })
        throw error
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      const existingUser = await getUserById(user.id as string)

      if (!existingUser || await hasActiveUserBlock(existingUser)) return false
      if (account?.provider === "passkey") {
        return isPasskeySignInAllowed(
          {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            userId: existingUser.id,
          },
          {
            findAccount: (provider, providerAccountId) => db.account.findUnique({
              where: {
                provider_providerAccountId: { provider, providerAccountId },
              },
              select: { id: true },
            }),
            hasManagementGrant: hasCurrentPasskeyManagementGrant,
          },
        )
      }
      if (account?.provider !== "credentials") return true

      if (!existingUser.emailVerified) return false

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id)

        if (!twoFactorConfirmation) return false

        await db.twoFactorConfirmation.delete({
          where: {
            id: twoFactorConfirmation.id
          }
        })
      }

      return true
    },
    async session({ token, session }) {
      applySessionIdentity(session, token)

      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
        session.user.isOAuth = token.isOAuth as boolean
      }

      return session
    },
    async jwt({ token, trigger }) {
      if (!token.sub || token.isRevoked) return token;

      const hadSession = Boolean(token.sessionId)
      const observeSuccessfulValidation = !hadSession
        || trigger === 'update'
        || shouldObserveSessionValidation(token.sessionId as string)
      let attempt = observeSuccessfulValidation
        ? authenticationTelemetry.start({
            flow: 'session_lifecycle',
            component: 'authentication.callback',
          })
        : null
      const ensureAttempt = () => {
        attempt ??= authenticationTelemetry.start({
          flow: 'session_lifecycle',
          component: 'authentication.callback',
        })
        return attempt
      }

      try {
        const existingUser = await getUserById(token.sub)
        if (!existingUser) {
          token.isRevoked = true
          ensureAttempt().complete({
            stage: 'account',
            outcome: 'rejected',
            reasonCode: 'account_missing',
            retryable: false,
          })
          return token
        }

        const nowSeconds = Math.floor(Date.now() / 1000)
        const expiresAt = new Date((token.exp ?? nowSeconds + 30 * 24 * 60 * 60) * 1000)
        const sessionState = await sessionSecurity.authenticate({
          userId: existingUser.id,
          sessionId: token.sessionId,
          issuedAt: new Date((token.iat ?? nowSeconds) * 1000),
          expiresAt,
          context: token.sessionId ? undefined : await currentSecurityContext(),
        })
        token.isRevoked = sessionState.status === 'revoked'
        if (sessionState.status === 'revoked') {
          ensureAttempt().complete({
            stage: 'session',
            outcome: 'rejected',
            reasonCode: expiresAt.getTime() <= Date.now() ? 'session_expired' : 'session_revoked',
            retryable: false,
          })
          return token
        }
        token.sessionId = sessionState.sessionId

        const existingAccount = await getAccountByUserId(existingUser.id)
        const isBlocked = await hasActiveUserBlock(existingUser)

        token.isOAuth = !!existingAccount
        token.name = existingUser.name
        token.email = existingUser.email
        token.role = existingUser.role
        token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled
        token.isBlocked = isBlocked

        let sessionReasonCode: 'session_rotated' | 'session_validated' | 'session_created';
        if (trigger === 'update') {
          sessionReasonCode = 'session_rotated';
        } else if (hadSession) {
          sessionReasonCode = 'session_validated';
        } else {
          sessionReasonCode = 'session_created';
        }

        attempt?.complete({
          stage: 'session',
          outcome: 'success',
          reasonCode: sessionReasonCode,
          retryable: false,
        })
        return token
      } catch (error) {
        ensureAttempt().complete({
          stage: 'session',
          outcome: 'failed',
          reasonCode: 'unexpected_failure',
          retryable: true,
          errorCategory: 'database',
        })
        throw error
      }
    }
  },
  adapter,
  session: { strategy: "jwt" },
  ...authConfig,
})
