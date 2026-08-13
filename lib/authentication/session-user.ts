import type { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export function applySessionIdentity(session: Session, token: JWT): Session {
  if (!session.user) return session;

  if (token.sub) session.user.id = token.sub;
  if (token.role) session.user.role = token.role as UserRole;

  session.user.isTwoFactorEnabled = Boolean(token.isTwoFactorEnabled);
  session.user.isBlocked = Boolean(token.isBlocked);
  session.user.isRevoked = Boolean(token.isRevoked);
  session.user.sessionId = token.sessionId;
  session.user.sessionIssuedAt = token.iat;

  return session;
}
