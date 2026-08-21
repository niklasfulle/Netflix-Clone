export type SecurityActivityEvent =
  | 'signed_in'
  | 'signed_out'
  | 'other_sessions_revoked'
  | 'password_changed'
  | 'password_reset'
  | 'email_changed'
  | 'account_blocked'
  | 'account_unblocked'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'qr_device_approved';

export type SecurityActivity = {
  id: string;
  event: SecurityActivityEvent;
  createdAt: Date;
  userAgent?: string | null;
};

type StoredContext = {
  ipHash: string | null;
  userAgent: string | null;
};

export interface SessionSecurityRepository {
  create(session: {
    id: string;
    userId: string;
    issuedAt: Date;
    expiresAt: Date;
    ipHash: string | null;
    userAgent: string | null;
  }): Promise<void>;
  findActive(sessionId: string, userId: string, now: Date): Promise<boolean>;
  getLegacyCutoff(userId: string): Promise<Date | null>;
  touch(sessionId: string, now: Date): Promise<void>;
  revokeAll(userId: string, now: Date): Promise<number>;
  revokeOne(userId: string, sessionId: string, now: Date): Promise<boolean>;
  revokeOthers(userId: string, currentSessionId: string, now: Date): Promise<number>;
  setLegacyCutoff(userId: string, now: Date): Promise<void>;
  recordActivity(activity: {
    userId: string;
    event: SecurityActivityEvent;
    createdAt: Date;
    ipHash: string | null;
    userAgent: string | null;
    details?: { revoked: number };
  }): Promise<void>;
  listActivity(userId: string, limit: number): Promise<SecurityActivity[]>;
  removeActivityBefore(cutoff: Date, limit: number): Promise<void>;
}

type SessionSecurityDependencies = {
  repository: SessionSecurityRepository;
  now(): Date;
  createId(): string;
  hashAddress(address: string): string;
};

type ClientContext = {
  address?: string;
  userAgent?: string;
};

const ACTIVITY_LIMIT = 20;
const ACTIVITY_RETENTION_MS = 90 * 24 * 60 * 60_000;
const CLEANUP_LIMIT = 25;

function storedContext(
  context: ClientContext | undefined,
  hashAddress: (address: string) => string,
): StoredContext {
  const address = context?.address?.trim();
  const userAgent = Array.from(context?.userAgent ?? '')
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, 255);

  return {
    ipHash: address && address !== 'unknown' ? hashAddress(address) : null,
    userAgent: userAgent || null,
  };
}

export function createSessionSecurity(dependencies: SessionSecurityDependencies) {
  const recordActivity = async (
    userId: string,
    event: SecurityActivityEvent,
    context?: ClientContext,
    details?: { revoked: number },
  ) => {
    await dependencies.repository.recordActivity({
      userId,
      event,
      createdAt: dependencies.now(),
      ...storedContext(context, dependencies.hashAddress),
      ...(details && { details }),
    });
  };

  return {
    async isAuthorized(input: {
      userId: string;
      sessionId?: string;
      issuedAt: Date;
    }) {
      const currentTime = dependencies.now();
      if (input.sessionId) {
        return dependencies.repository.findActive(
          input.sessionId,
          input.userId,
          currentTime,
        );
      }
      const legacyCutoff = await dependencies.repository.getLegacyCutoff(input.userId);
      return !legacyCutoff || input.issuedAt >= legacyCutoff;
    },

    async authenticate(input: {
      userId: string;
      sessionId?: string;
      issuedAt: Date;
      expiresAt: Date;
      context?: ClientContext;
    }): Promise<{ status: 'active'; sessionId: string } | { status: 'revoked' }> {
      const currentTime = dependencies.now();
      if (input.expiresAt <= currentTime) return { status: 'revoked' };

      if (input.sessionId) {
        const active = await dependencies.repository.findActive(
          input.sessionId,
          input.userId,
          currentTime,
        );
        if (!active) return { status: 'revoked' };
        await dependencies.repository.touch(input.sessionId, currentTime);
        return { status: 'active', sessionId: input.sessionId };
      }

      const legacyCutoff = await dependencies.repository.getLegacyCutoff(input.userId);
      if (legacyCutoff && input.issuedAt < legacyCutoff) return { status: 'revoked' };

      const sessionId = dependencies.createId();
      const context = storedContext(input.context, dependencies.hashAddress);
      await dependencies.repository.create({
        id: sessionId,
        userId: input.userId,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        ...context,
      });
      await dependencies.repository.recordActivity({
        userId: input.userId,
        event: 'signed_in',
        createdAt: currentTime,
        ...context,
      });
      return { status: 'active', sessionId };
    },

    async revokeOtherSessions(input: {
      userId: string;
      currentSessionId: string;
      context?: ClientContext;
    }) {
      const currentTime = dependencies.now();
      await dependencies.repository.setLegacyCutoff(input.userId, currentTime);
      const revoked = await dependencies.repository.revokeOthers(
        input.userId,
        input.currentSessionId,
        currentTime,
      );
      await recordActivity(
        input.userId,
        'other_sessions_revoked',
        input.context,
        { revoked },
      );
      return { revoked };
    },

    async revokeCurrentSession(input: {
      userId: string;
      sessionId: string;
      context?: ClientContext;
    }) {
      const currentTime = dependencies.now();
      const revoked = await dependencies.repository.revokeOne(
        input.userId,
        input.sessionId,
        currentTime,
      );
      if (revoked) {
        await recordActivity(input.userId, 'signed_out', input.context);
      }
    },

    async revokeAllSessions(input: {
      userId: string;
      event: Exclude<SecurityActivityEvent, 'signed_in' | 'other_sessions_revoked'>;
      context?: ClientContext;
    }) {
      const currentTime = dependencies.now();
      await dependencies.repository.setLegacyCutoff(input.userId, currentTime);
      const revoked = await dependencies.repository.revokeAll(input.userId, currentTime);
      await recordActivity(input.userId, input.event, input.context);
      return { revoked };
    },

    async recordActivity(
      userId: string,
      event: SecurityActivityEvent,
      context?: ClientContext,
    ) {
      await recordActivity(userId, event, context);
    },

    async getRecentActivity(userId: string) {
      const cutoff = new Date(dependencies.now().getTime() - ACTIVITY_RETENTION_MS);
      await dependencies.repository.removeActivityBefore(cutoff, CLEANUP_LIMIT);
      return dependencies.repository.listActivity(userId, ACTIVITY_LIMIT);
    },
  };
}

export type SessionSecurity = ReturnType<typeof createSessionSecurity>;
