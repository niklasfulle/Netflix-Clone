import type { User } from 'next-auth';
import type { GetUserInfo } from '@auth/core/providers/webauthn';

type PasskeyEligibleUser = User & {
  id: string;
  emailVerified: Date | null;
  isBlocked: boolean;
  blockedUntil: Date | null;
};

type PasskeyUserDependencies = {
  findByEmail(email: string): Promise<PasskeyEligibleUser | null>;
  isBlocked(user: PasskeyEligibleUser): Promise<boolean>;
};

export function createExistingPasskeyUserResolver(
  dependencies: PasskeyUserDependencies,
): GetUserInfo {
  return async (_options, request) => {
    const candidate = request.method === 'POST' ? request.body?.email : request.query?.email;
    if (typeof candidate !== 'string' || !candidate.trim()) return null;

    const user = await dependencies.findByEmail(candidate.trim().toLowerCase());
    if (!user?.emailVerified || (await dependencies.isBlocked(user))) return null;
    return { user, exists: true };
  };
}
