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
import { authenticationTelemetry } from '@/lib/authentication/production-telemetry';
import type {
  AuthenticationTelemetryAttempt,
  AuthenticationTelemetryRecord,
} from '@/lib/authentication/telemetry';
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

type MfaSuccessCode = 'mfa_enrollment_started' | 'mfa_enabled' | 'mfa_disabled';

function completeMfaAttempt<Result extends MfaActionFailure | { status: 'success'; code: MfaSuccessCode }>(
  attempt: AuthenticationTelemetryAttempt,
  stage: AuthenticationTelemetryRecord['stage'],
  result: Result,
): Result {
  if (result.status === 'success') {
    attempt.complete({
      stage,
      outcome: 'success',
      reasonCode: result.code,
      retryable: false,
    });
    return result;
  }
  attempt.complete({
    stage,
    outcome: 'rejected',
    reasonCode: result.code,
    retryable: false,
    errorCategory: result.code === 'unauthorized'
      || result.code === 'reauthentication_required'
      || result.code === 'invalid_credentials'
      ? 'credentials'
      : 'validation',
  });
  return result;
}

function failMfaAttempt(
  attempt: AuthenticationTelemetryAttempt,
  stage: AuthenticationTelemetryRecord['stage'],
  errorCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']>,
) {
  attempt.complete({
    stage,
    outcome: 'failed',
    reasonCode: 'unexpected_failure',
    retryable: true,
    errorCategory,
  });
}

async function runMfaStep<Result>(
  attempt: AuthenticationTelemetryAttempt,
  stage: AuthenticationTelemetryRecord['stage'],
  errorCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']>,
  operation: () => Promise<Result>,
): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    failMfaAttempt(attempt, stage, errorCategory);
    throw error;
  }
}

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

async function sendSecurityNotice(email: string, event: string) {
  const attempt = authenticationTelemetry.start({
    flow: 'mail_delivery',
    component: 'authentication.action',
  });
  try {
    await sendSecurityNotificationEmail(email, event);
    attempt.complete({
      stage: 'mail', outcome: 'success', reasonCode: 'mail_delivered', retryable: false,
    });
  } catch {
    attempt.complete({
      stage: 'mail', outcome: 'failed', reasonCode: 'delivery_failed',
      retryable: true, errorCategory: 'mail',
    });
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
  const attempt = authenticationTelemetry.start({
    flow: 'mfa_enrollment',
    component: 'authentication.action',
  });
  let stage: AuthenticationTelemetryRecord['stage'] = 'credentials';
  try {
    const account = await reauthenticate(password);
    if ('status' in account) return completeMfaAttempt(attempt, stage, account);
    if (account.isTwoFactorEnabled) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'mfa_already_enabled' },
      );
    }

    stage = 'mfa';
    const secret = generateTotpSecret();
    await savePendingMfaAuthenticator(account.id, encryptMfaSecret(secret));
    logBackendAction('mfa_enrollment_started', {}, 'info');
    return completeMfaAttempt(attempt, stage, {
      status: 'success',
      code: 'mfa_enrollment_started',
      setup: {
        secret,
        uri: createTotpEnrollmentUri({ secret, accountName: account.email }),
      },
    });
  } catch (error) {
    failMfaAttempt(attempt, stage, stage === 'credentials' ? 'credentials' : 'database');
    throw error;
  }
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
  const attempt = authenticationTelemetry.start({
    flow: 'mfa_enrollment',
    component: 'authentication.action',
  });
  let stage: AuthenticationTelemetryRecord['stage'] = 'account';
  try {
    const account = await authenticatedAccount();
    if (!account) {
      return completeMfaAttempt(attempt, stage, { status: 'rejected', code: 'unauthorized' });
    }
    stage = 'mfa';
    const authenticator = await getMfaAuthenticator(account.id);
    if (!authenticator || authenticator.verifiedAt) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'mfa_setup_missing' },
      );
    }

    const now = new Date();
    if (now.getTime() - authenticator.updatedAt.getTime() > 10 * 60_000) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'mfa_setup_expired' },
      );
    }
    const secret = decryptMfaSecret(authenticator.secretCiphertext);
    const counter = findMatchingTotpCounter(secret, code, now);
    if (counter === null) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'invalid_mfa_code' },
      );
    }

    const recoveryCodes = generateRecoveryCodes();
    const activated = await activateMfaAuthenticator(
      account.id,
      counter,
      recoveryCodes.map((recoveryCode) => hashRecoveryCode(account.id, recoveryCode)),
      now,
    );
    if (!activated) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'mfa_setup_missing' },
      );
    }

    await runMfaStep(attempt, 'session', 'database', () => (
      secureMfaChange(account, 'mfa_enabled')
    ));
    logBackendAction('mfa_enabled', {}, 'info');
    await sendSecurityNotice(
      account.email as string,
      'Authenticator-based multi-factor authentication was enabled.',
    );
    return completeMfaAttempt(attempt, 'mfa', {
      status: 'success',
      code: 'mfa_enabled',
      recoveryCodes,
    });
  } catch (error) {
    failMfaAttempt(attempt, stage, 'database');
    throw error;
  }
}

export async function disableMfa({
  password,
  code,
}: {
  password: string;
  code: string;
}): Promise<MfaActionFailure | { status: 'success'; code: 'mfa_disabled' }> {
  const attempt = authenticationTelemetry.start({
    flow: 'mfa_management',
    component: 'authentication.action',
  });
  let stage: AuthenticationTelemetryRecord['stage'] = 'credentials';
  try {
    const account = await reauthenticate(password);
    if ('status' in account) return completeMfaAttempt(attempt, stage, account);
    if (!account.isTwoFactorEnabled) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'mfa_not_enabled' },
      );
    }
    stage = 'mfa';
    if (!code || !(await consumeMfaChallenge(account.id, code, new Date()))) {
      return completeMfaAttempt(
        attempt,
        stage,
        { status: 'rejected', code: 'invalid_mfa_code' },
      );
    }

    await removeMfa(account.id);
    await runMfaStep(attempt, 'session', 'database', () => (
      secureMfaChange(account, 'mfa_disabled')
    ));
    logBackendAction('mfa_disabled', {}, 'info');
    await sendSecurityNotice(
      account.email,
      'Multi-factor authentication was disabled.',
    );
    return completeMfaAttempt(attempt, 'mfa', { status: 'success', code: 'mfa_disabled' });
  } catch (error) {
    failMfaAttempt(attempt, stage, stage === 'credentials' ? 'credentials' : 'database');
    throw error;
  }
}
