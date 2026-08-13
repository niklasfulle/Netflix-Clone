const MANAGEMENT_GRANT_TTL_MS = 5 * 60_000;

const hasControlCharacter = (value: string) => Array.from(value).some((character) => {
  const code = character.codePointAt(0) ?? 0;
  return code <= 31 || code === 127;
});

export type PasskeySummary = {
  credentialId: string;
  label: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export interface PasskeyManagementRepository {
  createGrant(grant: {
    tokenHash: string;
    userId: string;
    sessionId: string;
    expiresAt: Date;
  }): Promise<void>;
  hasActiveGrant(
    tokenHash: string,
    userId: string,
    sessionId: string | undefined,
    now: Date,
  ): Promise<boolean>;
  cleanupGrants(now: Date): Promise<void>;
  list(userId: string): Promise<PasskeySummary[]>;
  rename(userId: string, credentialId: string, label: string): Promise<boolean>;
  removeRecoverySafe(
    userId: string,
    credentialId: string,
  ): Promise<'removed' | 'not_found' | 'last_sign_in_method'>;
}

type PasskeyManagementDependencies = {
  repository: PasskeyManagementRepository;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  createToken(): string;
  hashToken(token: string): string;
  now(): Date;
};

export function createPasskeyManagement(dependencies: PasskeyManagementDependencies) {
  const hasGrant = (
    userId: string,
    sessionId: string | undefined,
    token: string | undefined,
  ) => {
    if (!token || !sessionId) return Promise.resolve(false);
    return dependencies.repository.hasActiveGrant(
      dependencies.hashToken(token),
      userId,
      sessionId,
      dependencies.now(),
    );
  };

  const hasEnrollmentGrant = (userId: string, token: string | undefined) => {
    if (!token) return Promise.resolve(false);
    return dependencies.repository.hasActiveGrant(
      dependencies.hashToken(token),
      userId,
      undefined,
      dependencies.now(),
    );
  };

  return {
    async authorize(input: { userId: string; sessionId: string; password: string }) {
      const authorized = await dependencies.verifyPassword(input.userId, input.password);
      if (!authorized) return { status: 'rejected' as const, code: 'invalid_password' as const };

      const now = dependencies.now();
      const token = dependencies.createToken();
      const expiresAt = new Date(now.getTime() + MANAGEMENT_GRANT_TTL_MS);
      await dependencies.repository.cleanupGrants(now);
      await dependencies.repository.createGrant({
        tokenHash: dependencies.hashToken(token),
        userId: input.userId,
        sessionId: input.sessionId,
        expiresAt,
      });
      return { status: 'authorized' as const, token, expiresAt };
    },
    hasGrant,
    hasEnrollmentGrant,
    async list(input: { userId: string; sessionId: string; token?: string }) {
      if (!(await hasGrant(input.userId, input.sessionId, input.token))) {
        return { status: 'rejected' as const, code: 'reauthentication_required' as const };
      }
      return {
        status: 'success' as const,
        passkeys: await dependencies.repository.list(input.userId),
      };
    },
    async rename(input: {
      userId: string;
      sessionId: string;
      token?: string;
      credentialId: string;
      label: string;
    }) {
      if (!(await hasGrant(input.userId, input.sessionId, input.token))) {
        return { status: 'rejected' as const, code: 'reauthentication_required' as const };
      }
      const label = input.label.trim();
      if (!label || label.length > 64 || hasControlCharacter(label)) {
        return { status: 'rejected' as const, code: 'invalid_label' as const };
      }
      const renamed = await dependencies.repository.rename(
        input.userId,
        input.credentialId,
        label,
      );
      return renamed
        ? { status: 'success' as const }
        : { status: 'rejected' as const, code: 'not_found' as const };
    },
    async remove(input: {
      userId: string;
      sessionId: string;
      token?: string;
      credentialId: string;
    }) {
      if (!(await hasGrant(input.userId, input.sessionId, input.token))) {
        return { status: 'rejected' as const, code: 'reauthentication_required' as const };
      }
      const result = await dependencies.repository.removeRecoverySafe(
        input.userId,
        input.credentialId,
      );
      return result === 'removed'
        ? { status: 'success' as const }
        : { status: 'rejected' as const, code: result };
    },
  };
}
