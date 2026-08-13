import { db } from '@/lib/db';
import {
  hashOneTimeToken,
  type OneTimeTokenPurpose,
} from '@/lib/authentication/token-crypto';

export type TokenConsumption =
  | { status: 'invalid' }
  | { status: 'expired' }
  | {
      status: 'valid';
      email: string;
      userId: string | null;
      targetEmail?: string | null;
    };

export async function consumeAuthToken(
  purpose: OneTimeTokenPurpose,
  rawToken: string,
  now: Date,
  expectedEmail?: string,
): Promise<TokenConsumption> {
  const tokenHash = hashOneTimeToken(purpose, rawToken);

  return db.$transaction(async (transaction) => {
    const token = await (async () => {
      if (purpose === 'verification') {
        return transaction.verificationToken.findUnique({ where: { tokenHash } });
      }
      if (purpose === 'password-reset') {
        return transaction.passwordResetToken.findUnique({ where: { tokenHash } });
      }
      return transaction.twoFactorToken.findUnique({ where: { tokenHash } });
    })();

    if (!token || (expectedEmail && token.email !== expectedEmail)) {
      return { status: 'invalid' };
    }

    const remove = async () => {
      if (purpose === 'verification') {
        return transaction.verificationToken.deleteMany({ where: { id: token.id, tokenHash } });
      }
      if (purpose === 'password-reset') {
        return transaction.passwordResetToken.deleteMany({ where: { id: token.id, tokenHash } });
      }
      return transaction.twoFactorToken.deleteMany({ where: { id: token.id, tokenHash } });
    };

    if (token.expires < now) {
      await remove();
      return { status: 'expired' };
    }

    const deleted = await remove();
    if (deleted.count !== 1) {
      return { status: 'invalid' };
    }

    const targetEmail = 'targetEmail' in token &&
      (typeof token.targetEmail === 'string' || token.targetEmail === null)
      ? token.targetEmail
      : undefined;
    const result: Extract<TokenConsumption, { status: 'valid' }> = {
      status: 'valid',
      email: token.email,
      userId: token.userId,
    };
    if (targetEmail !== undefined) result.targetEmail = targetEmail;
    return result;
  });
}
