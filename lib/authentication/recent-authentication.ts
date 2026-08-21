const RECENT_AUTHENTICATION_LIFETIME_MS = 5 * 60_000;

type RecentAuthenticationDependencies = {
  users: {
    findById(userId: string): Promise<{
      id: string;
      hashedPassword: string | null;
      isBlocked: boolean;
      isTwoFactorEnabled: boolean;
    } | null>;
  };
  passwords: {
    verify(password: string, hashedPassword: string): Promise<boolean>;
  };
  mfa: {
    consume(userId: string, code: string, now: Date): Promise<'totp' | 'recovery' | null>;
  };
  grants: {
    upsert(input: { userId: string; sessionId: string; expiresAt: Date }): Promise<void>;
  };
  clock: {
    now(): Date;
  };
};

export function createRecentAuthenticationService(dependencies: RecentAuthenticationDependencies) {
  return {
    async verifyAndGrant(input: {
      userId: string;
      sessionId: string;
      password: string;
      mfaCode?: string;
    }): Promise<{ status: 'verified' } | { status: 'rejected' }> {
      const user = await dependencies.users.findById(input.userId);
      if (!user?.hashedPassword || user.isBlocked) return { status: 'rejected' };

      const passwordMatches = await dependencies.passwords.verify(input.password, user.hashedPassword);
      if (!passwordMatches) return { status: 'rejected' };

      const now = dependencies.clock.now();
      if (user.isTwoFactorEnabled) {
        if (!input.mfaCode || !await dependencies.mfa.consume(input.userId, input.mfaCode, now)) {
          return { status: 'rejected' };
        }
      }

      await dependencies.grants.upsert({
        userId: input.userId,
        sessionId: input.sessionId,
        expiresAt: new Date(now.getTime() + RECENT_AUTHENTICATION_LIFETIME_MS),
      });
      return { status: 'verified' };
    },
  };
}
