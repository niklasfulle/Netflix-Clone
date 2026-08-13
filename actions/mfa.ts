"use server";

import bcrypt from 'bcryptjs';

import {
  activateMfaAuthenticator,
  consumeMfaChallenge,
  getMfaAuthenticator,
  removeMfa,
  savePendingMfaAuthenticator,
} from '@/data/mfa';
import { getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
import {
  createTotpEnrollmentUri,
  decryptMfaSecret,
  encryptMfaSecret,
  findMatchingTotpCounter,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
} from '@/lib/authentication/mfa-crypto';
import { logBackendAction } from '@/lib/logger';
import { sendSecurityNotificationEmail } from '@/lib/mail';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';

type MfaActionFailure = {
  status: 'rejected';
  code:
    | 'unauthorized'
    | 'reauthentication_required'
    | 'invalid_credentials'
    | 'mfa_already_enabled'
    | 'mfa_not_enabled'
    | 'mfa_setup_missing'
    | 'mfa_setup_expired'
    | 'invalid_mfa_code';
};

type ReauthenticatedUser = {
  id: string;
  email: string;
  hashedPassword: string;
  isTwoFactorEnabled: boolean;
  sessionId?: string;
};

async function authenticatedAccount() {
  const sessionUser = await currentUser();
  if (!sessionUser?.id) return null;
  const user = await getUserById(sessionUser.id);
  if (!user?.email) return null;
  return { ...user, sessionId: sessionUser.sessionId };
}

async function reauthenticate(password: string): Promise<ReauthenticatedUser | MfaActionFailure> {
  if (!password) return { status: 'rejected', code: 'reauthentication_required' };
  const user = await authenticatedAccount();
  if (!user?.hashedPassword) return { status: 'rejected', code: 'invalid_credentials' };
  if (!(await bcrypt.compare(password, user.hashedPassword))) {
    return { status: 'rejected', code: 'invalid_credentials' };
  }
  return {
    id: user.id,
    email: user.email as string,
    hashedPassword: user.hashedPassword,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    sessionId: user.sessionId,
  };
}

async function sendSecurityNotice(email: string, event: string, userId: string) {
  try {
    await sendSecurityNotificationEmail(email, event);
  } catch {
    logBackendAction('mfa_security_notice_failed', { userId }, 'error');
  }
}

async function secureMfaChange(
  account: { id: string; sessionId?: string },
  event: 'mfa_enabled' | 'mfa_disabled',
) {
  const context = await currentSecurityContext();
  if (account.sessionId) {
    await sessionSecurity.revokeOtherSessions({
      userId: account.id,
      currentSessionId: account.sessionId,
      context,
    });
    await sessionSecurity.recordActivity(account.id, event, context);
    return;
  }
  await sessionSecurity.revokeAllSessions({ userId: account.id, event, context });
}

export async function beginTotpEnrollment({
  password,
}: {
  password: string;
}): Promise<MfaActionFailure | {
  status: 'success';
  code: 'mfa_enrollment_started';
  setup: { secret: string; uri: string };
}> {
  const account = await reauthenticate(password);
  if ('status' in account) return account;
  if (account.isTwoFactorEnabled) {
    return { status: 'rejected', code: 'mfa_already_enabled' };
  }

  const secret = generateTotpSecret();
  await savePendingMfaAuthenticator(account.id, encryptMfaSecret(secret));
  logBackendAction('mfa_enrollment_started', { userId: account.id }, 'info');
  return {
    status: 'success',
    code: 'mfa_enrollment_started',
    setup: {
      secret,
      uri: createTotpEnrollmentUri({ secret, accountName: account.email }),
    },
  };
}

export async function confirmTotpEnrollment({
  code,
}: {
  code: string;
}): Promise<MfaActionFailure | {
  status: 'success';
  code: 'mfa_enabled';
  recoveryCodes: string[];
}> {
  const account = await authenticatedAccount();
  if (!account) return { status: 'rejected', code: 'unauthorized' };
  const authenticator = await getMfaAuthenticator(account.id);
  if (!authenticator || authenticator.verifiedAt) {
    return { status: 'rejected', code: 'mfa_setup_missing' };
  }

  const now = new Date();
  if (now.getTime() - authenticator.updatedAt.getTime() > 10 * 60_000) {
    return { status: 'rejected', code: 'mfa_setup_expired' };
  }
  const secret = decryptMfaSecret(authenticator.secretCiphertext);
  const counter = findMatchingTotpCounter(secret, code, now);
  if (counter === null) return { status: 'rejected', code: 'invalid_mfa_code' };

  const recoveryCodes = generateRecoveryCodes();
  const activated = await activateMfaAuthenticator(
    account.id,
    counter,
    recoveryCodes.map((recoveryCode) => hashRecoveryCode(account.id, recoveryCode)),
    now,
  );
  if (!activated) return { status: 'rejected', code: 'mfa_setup_missing' };

  await secureMfaChange(account, 'mfa_enabled');
  logBackendAction('mfa_enabled', { userId: account.id }, 'info');
  await sendSecurityNotice(
    account.email as string,
    'Authenticator-based multi-factor authentication was enabled.',
    account.id,
  );
  return { status: 'success', code: 'mfa_enabled', recoveryCodes };
}

export async function disableMfa({
  password,
  code,
}: {
  password: string;
  code: string;
}): Promise<MfaActionFailure | { status: 'success'; code: 'mfa_disabled' }> {
  const account = await reauthenticate(password);
  if ('status' in account) return account;
  if (!account.isTwoFactorEnabled) {
    return { status: 'rejected', code: 'mfa_not_enabled' };
  }
  if (!code || !(await consumeMfaChallenge(account.id, code, new Date()))) {
    return { status: 'rejected', code: 'invalid_mfa_code' };
  }

  await removeMfa(account.id);
  await secureMfaChange(account, 'mfa_disabled');
  logBackendAction('mfa_disabled', { userId: account.id }, 'info');
  await sendSecurityNotice(
    account.email,
    'Multi-factor authentication was disabled.',
    account.id,
  );
  return { status: 'success', code: 'mfa_disabled' };
}
