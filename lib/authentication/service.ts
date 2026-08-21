import {
  LoginSchema,
  NewPasswordSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '@/schemas';

import { normalizeAuthEmail, type AuthResult } from './contracts';
import type {
  AuthenticationTelemetry,
  AuthenticationTelemetryAttempt,
  AuthenticationTelemetryRecord,
} from './telemetry';

function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***';
  if (localPart.length === 1) return `***@${domain}`;
  return `${localPart[0]}***${localPart.at(-1)}@${domain}`;
}

type AuthUser = {
  id: string;
  email: string | null;
  hashedPassword: string | null;
  emailVerified: Date | null;
  isTwoFactorEnabled: boolean;
  hasVerifiedAuthenticator?: boolean;
  isBlocked?: boolean;
};

type ThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  keyHash: string;
};

type AuthThrottleScope =
  | 'login'
  | 'register'
  | 'password-reset'
  | 'verification-resend'
  | 'two-factor'
  | 'two-factor-send';

export interface AuthenticationDependencies {
  users: {
    findByEmail(email: string): Promise<AuthUser | null>;
    findById(userId: string): Promise<AuthUser | null>;
    create(account: { name: string; email: string; hashedPassword: string }): Promise<
      { created: true; userId: string } | { created: false }
    >;
    updatePassword(userId: string, hashedPassword: string): Promise<void>;
    verifyEmail(userId: string, email: string, verifiedAt: Date): Promise<boolean>;
  };
  passwords: {
    hash(password: string): Promise<string>;
    verify(password: string, hashedPassword: string): Promise<boolean>;
  };
  throttle: {
    consume(scope: AuthThrottleScope, identity: string): Promise<ThrottleResult>;
    release(scope: AuthThrottleScope, identity: string): Promise<void>;
  };
  tokens: {
    issueVerification(
      email: string,
      binding?: { userId?: string; targetEmail?: string },
    ): Promise<{ email: string; token: string }>;
    issuePasswordReset(email: string, userId?: string): Promise<{ email: string; token: string }>;
    issueTwoFactor(email: string, userId?: string): Promise<{ email: string; token: string }>;
    consumeVerification(token: string, now: Date): Promise<TokenConsumption>;
    consumePasswordReset(token: string, now: Date): Promise<TokenConsumption>;
    consumeTwoFactor(email: string, token: string, now: Date): Promise<TokenConsumption>;
  };
  mail: {
    sendVerification(message: { email: string; token: string }): Promise<void>;
    sendPasswordReset(message: { email: string; token: string }): Promise<void>;
    sendTwoFactor(message: { email: string; token: string }): Promise<void>;
  };
  session: {
    signInCredentials(credentials: { email: string; password: string }): Promise<void>;
    isRedirectError(error: unknown): boolean;
  };
  telemetry: AuthenticationTelemetry;
  audit: {
    log(event: string, context: Record<string, unknown>, level: 'info' | 'warn' | 'error'): void;
  };
  confirmations: {
    replaceForUser(userId: string): Promise<void>;
  };
  mfa: {
    consumeChallenge(
      userId: string,
      code: string,
      now: Date,
    ): Promise<'totp' | 'recovery' | null>;
  };
  security: {
    revokeAllSessions(
      userId: string,
      event: 'password_reset' | 'email_changed',
    ): Promise<void>;
  };
  clock: {
    now(): Date;
  };
}

type TokenConsumption =
  | { status: 'invalid' }
  | { status: 'expired' }
  | {
      status: 'valid';
      email: string;
      userId: string | null;
      targetEmail?: string | null;
    };

interface LoginCommand {
  email: string;
  password: string;
  code?: string;
  challengeMethod?: 'totp' | 'email_otp';
}

interface RegisterCommand {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

interface PasswordResetRequestCommand {
  email: string;
}

interface SetNewPasswordCommand {
  token?: string | null;
  password: string;
  confirm: string;
}

interface VerifyEmailCommand {
  token?: string | null;
}

export function createAuthenticationService(dependencies: AuthenticationDependencies) {
  const errorCategoryForResult = (
    result: Extract<AuthResult, { status: 'rejected' }>,
  ): NonNullable<AuthenticationTelemetryRecord['errorCategory']> => {
    if (result.code === 'invalid_fields') return 'validation';
    if (result.code === 'delivery_failed') return 'mail';
    if (result.code === 'auth_failed') return 'provider';
    return 'credentials';
  };

  const completeAuthenticationAttempt = (
    attempt: AuthenticationTelemetryAttempt,
    stage: AuthenticationTelemetryRecord['stage'],
    result: AuthResult,
    successOutcome: 'success' | 'challenge' = 'success',
  ): AuthResult => {
    if (result.status === 'retry') {
      attempt.complete({
        stage,
        outcome: 'retry',
        reasonCode: result.code,
        retryable: true,
        errorCategory: 'rate_limit',
      });
      return result;
    }
    if (result.status === 'challenge') {
      attempt.complete({
        stage,
        outcome: 'challenge',
        reasonCode: result.code,
        retryable: false,
      });
      return result;
    }
    if (result.status === 'success') {
      attempt.complete({
        stage,
        outcome: successOutcome,
        reasonCode: result.code,
        retryable: false,
      });
      return result;
    }

    const failed = result.code === 'delivery_failed' || result.code === 'auth_failed';
    attempt.complete({
      stage,
      outcome: failed ? 'failed' : 'rejected',
      reasonCode: result.code,
      retryable: failed,
      errorCategory: errorCategoryForResult(result),
    });
    return result;
  };

  const failAuthenticationAttempt = (
    attempt: AuthenticationTelemetryAttempt,
    stage: AuthenticationTelemetryRecord['stage'],
    errorCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']>,
  ) => {
    attempt.complete({
      stage,
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      retryable: true,
      errorCategory,
    });
  };

  const runAuthenticationStep = async <Result>(
    attempt: AuthenticationTelemetryAttempt,
    stage: AuthenticationTelemetryRecord['stage'],
    errorCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']>,
    operation: () => Promise<Result>,
  ): Promise<Result> => {
    try {
      return await operation();
    } catch (error) {
      failAuthenticationAttempt(attempt, stage, errorCategory);
      throw error;
    }
  };

  const completeCredentialSignIn = async (
    attempt: AuthenticationTelemetryAttempt,
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    try {
      return completeAuthenticationAttempt(
        attempt,
        'session',
        await signInWithCredentials(email, password),
      );
    } catch (error) {
      if (!dependencies.session.isRedirectError(error)) {
        failAuthenticationAttempt(attempt, 'session', 'provider');
      }
      throw error;
    }
  };

  const deliver = async (kind: 'verification' | 'password-reset' | 'two-factor', send: () => Promise<void>) => {
    try {
      await send();
      return true;
    } catch {
      dependencies.audit.log('auth_mail_delivery_failed', { kind }, 'error');
      return false;
    }
  };

  const rateLimited = (throttleResult: ThrottleResult): AuthResult => ({
    status: 'retry',
    code: 'rate_limited',
    retryAfterSeconds: throttleResult.retryAfterSeconds,
  });

  const resendVerificationFor = async (user: AuthUser, email: string): Promise<AuthResult | null> => {
    if (user.emailVerified) return null;

    const resendResult = await dependencies.throttle.consume('verification-resend', email);
    if (!resendResult.allowed) return rateLimited(resendResult);

    const verificationToken = await dependencies.tokens.issueVerification(email, {
      userId: user.id,
    });
    const delivered = await deliver(
      'verification',
      () => dependencies.mail.sendVerification(verificationToken),
    );
    if (!delivered) return { status: 'rejected', code: 'delivery_failed' };

    dependencies.audit.log('login_confirmation_sent', {}, 'info');
    return { status: 'success', code: 'verification_sent' };
  };

  const consumeAuthenticatorCode = async (
    user: AuthUser,
    email: string,
    code: string,
  ): Promise<AuthResult | null> => {
    const consumedMethod = await dependencies.mfa.consumeChallenge(
      user.id,
      code,
      dependencies.clock.now(),
    );
    if (!consumedMethod) {
      dependencies.audit.log('login_invalid_code', {}, 'error');
      return { status: 'rejected', code: 'invalid_code' };
    }
    dependencies.audit.log('login_mfa_consumed', { method: consumedMethod }, 'info');
    return null;
  };

  const consumeEmailCode = async (email: string, code: string): Promise<AuthResult | null> => {
    const storedToken = await dependencies.tokens.consumeTwoFactor(
      email,
      code,
      dependencies.clock.now(),
    );
    if (storedToken.status === 'invalid') {
      dependencies.audit.log('login_invalid_code', {}, 'error');
      return { status: 'rejected', code: 'invalid_code' };
    }
    if (storedToken.status === 'expired') {
      dependencies.audit.log('login_code_expired', {}, 'error');
      return { status: 'rejected', code: 'code_expired' };
    }
    return null;
  };

  const verifyTwoFactorCode = async (
    user: AuthUser,
    email: string,
    code: string,
    challengeMethod?: LoginCommand['challengeMethod'],
  ): Promise<AuthResult | null> => {
    const twoFactorLimit = await dependencies.throttle.consume('two-factor', email);
    if (!twoFactorLimit.allowed) return rateLimited(twoFactorLimit);

    const validationResult = user.hasVerifiedAuthenticator && challengeMethod !== 'email_otp'
      ? await consumeAuthenticatorCode(user, email, code)
      : await consumeEmailCode(email, code);
    if (validationResult) return validationResult;

    await dependencies.confirmations.replaceForUser(user.id);
    return null;
  };

  const issueTwoFactorChallenge = async (
    user: AuthUser,
    email: string,
    challengeMethod?: LoginCommand['challengeMethod'],
  ): Promise<AuthResult> => {
    if (user.hasVerifiedAuthenticator && challengeMethod !== 'email_otp') {
      return {
        status: 'challenge',
        code: 'two_factor_required',
        challenge: 'totp',
        canUseEmailFallback: true,
      };
    }

    const sendLimit = await dependencies.throttle.consume('two-factor-send', email);
    if (!sendLimit.allowed) return rateLimited(sendLimit);

    const twoFactorToken = await dependencies.tokens.issueTwoFactor(email, user.id);
    const delivered = await deliver(
      'two-factor',
      () => dependencies.mail.sendTwoFactor(twoFactorToken),
    );
    if (!delivered) return { status: 'rejected', code: 'delivery_failed' };

    dependencies.audit.log('login_two_factor_sent', {}, 'info');
    return {
      status: 'challenge',
      code: 'two_factor_required',
      challenge: 'email_otp',
      maskedDestination: maskEmailAddress(email),
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    };
  };

  const resolveTwoFactor = async (
    user: AuthUser,
    email: string,
    command: Pick<LoginCommand, 'code' | 'challengeMethod'>,
  ): Promise<AuthResult | null> => {
    if (!user.isTwoFactorEnabled) return null;
    if (command.code) {
      return verifyTwoFactorCode(user, email, command.code, command.challengeMethod);
    }
    return issueTwoFactorChallenge(user, email, command.challengeMethod);
  };

  const signInWithCredentials = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await dependencies.session.signInCredentials({ email, password });
    } catch (error) {
      if (dependencies.session.isRedirectError(error)) {
        await dependencies.throttle.release('login', email);
        dependencies.audit.log('login_success', {}, 'info');
        throw error;
      }
      dependencies.audit.log('login_auth_error', {}, 'error');
      return { status: 'rejected', code: 'auth_failed' };
    }

    await dependencies.throttle.release('login', email);
    dependencies.audit.log('login_success', {}, 'info');
    return { status: 'success', code: 'signed_in' };
  };

  return {
    async register(command: RegisterCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'registration',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'request';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'unexpected';

      try {
        const parsedCommand = RegisterSchema.safeParse({
          ...command,
          email: normalizeAuthEmail(command.email),
        });

        if (!parsedCommand.success) {
          dependencies.audit.log('register_invalid_fields', {
            invalidFields: parsedCommand.error.issues.map((issue) => issue.path.join('.')),
          }, 'error');
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_fields' },
          );
        }

        const { name, email, password } = parsedCommand.data;
        const throttleResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.throttle.consume('register', email),
        );
        if (!throttleResult.allowed) {
          dependencies.audit.log('auth_rate_limited', {
            scope: 'register',
            retryAfterSeconds: throttleResult.retryAfterSeconds,
          }, 'warn');
          return completeAuthenticationAttempt(attempt, stage, rateLimited(throttleResult));
        }

        stage = 'account';
        const existingUser = await dependencies.users.findByEmail(email);
        if (existingUser) {
          dependencies.audit.log('register_request_accepted', {}, 'info');
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'success', code: 'verification_sent' },
          );
        }

        const hashedPassword = await runAuthenticationStep(
          attempt,
          stage,
          'unexpected',
          () => dependencies.passwords.hash(password),
        );
        const created = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.users.create({ name, email, hashedPassword }),
        );
        if (!created.created) {
          dependencies.audit.log('register_request_accepted', {}, 'info');
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'success', code: 'verification_sent' },
          );
        }
        const verificationToken = await runAuthenticationStep(
          attempt,
          'token',
          'database',
          () => dependencies.tokens.issueVerification(email, { userId: created.userId }),
        );
        stage = 'mail';
        const delivered = await deliver(
          'verification',
          () => dependencies.mail.sendVerification(verificationToken),
        );
        if (!delivered) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'delivery_failed' },
          );
        }
        dependencies.audit.log('register_success', {}, 'info');
        return completeAuthenticationAttempt(
          attempt,
          stage,
          { status: 'success', code: 'verification_sent' },
        );
      } catch (error) {
        failAuthenticationAttempt(attempt, stage, failureCategory);
        throw error;
      }
    },

    async requestPasswordReset(command: PasswordResetRequestCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'password_reset_request',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'request';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'unexpected';

      try {
        const parsedCommand = ResetPasswordSchema.safeParse({
          email: normalizeAuthEmail(command.email),
        });
        if (!parsedCommand.success) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_fields' },
          );
        }

        const { email } = parsedCommand.data;
        const throttleResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.throttle.consume('password-reset', email),
        );
        if (!throttleResult.allowed) {
          dependencies.audit.log('auth_rate_limited', {
            scope: 'password-reset',
            retryAfterSeconds: throttleResult.retryAfterSeconds,
          }, 'warn');
          return completeAuthenticationAttempt(attempt, stage, rateLimited(throttleResult));
        }

        stage = 'account';
        const existingUser = await dependencies.users.findByEmail(email);
        if (existingUser) {
          const resetToken = await runAuthenticationStep(
            attempt,
            'token',
            'database',
            () => dependencies.tokens.issuePasswordReset(email, existingUser.id),
          );
          stage = 'mail';
          const delivered = await deliver(
            'password-reset',
            () => dependencies.mail.sendPasswordReset(resetToken),
          );
          if (!delivered) {
            attempt.complete({
              stage,
              outcome: 'failed',
              reasonCode: 'delivery_failed',
              retryable: true,
              errorCategory: 'mail',
            });
            dependencies.audit.log('password_reset_request_accepted', {}, 'info');
            return { status: 'success', code: 'password_reset_sent' };
          }
        }
        dependencies.audit.log('password_reset_request_accepted', {}, 'info');
        return completeAuthenticationAttempt(
          attempt,
          stage,
          { status: 'success', code: 'password_reset_sent' },
        );
      } catch (error) {
        failAuthenticationAttempt(attempt, stage, failureCategory);
        throw error;
      }
    },

    async resendVerification(command: PasswordResetRequestCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'verification_resend',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'request';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'unexpected';

      try {
        const parsedCommand = ResetPasswordSchema.safeParse({
          email: normalizeAuthEmail(command.email),
        });
        if (!parsedCommand.success) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_fields' },
          );
        }

        const { email } = parsedCommand.data;
        const throttleResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.throttle.consume('verification-resend', email),
        );
        if (!throttleResult.allowed) {
          dependencies.audit.log('auth_rate_limited', {
            scope: 'verification-resend',
            retryAfterSeconds: throttleResult.retryAfterSeconds,
          }, 'warn');
          return completeAuthenticationAttempt(attempt, stage, rateLimited(throttleResult));
        }

        stage = 'account';
        const user = await dependencies.users.findByEmail(email);
        if (user && !user.emailVerified) {
          const verificationToken = await runAuthenticationStep(
            attempt,
            'token',
            'database',
            () => dependencies.tokens.issueVerification(email, { userId: user.id }),
          );
          stage = 'mail';
          const delivered = await deliver(
            'verification',
            () => dependencies.mail.sendVerification(verificationToken),
          );
          if (!delivered) {
            attempt.complete({
              stage,
              outcome: 'failed',
              reasonCode: 'delivery_failed',
              retryable: true,
              errorCategory: 'mail',
            });
            dependencies.audit.log('verification_resend_accepted', {}, 'info');
            return { status: 'success', code: 'verification_sent' };
          }
        }
        dependencies.audit.log('verification_resend_accepted', {}, 'info');
        return completeAuthenticationAttempt(
          attempt,
          stage,
          { status: 'success', code: 'verification_sent' },
        );
      } catch (error) {
        failAuthenticationAttempt(attempt, stage, failureCategory);
        throw error;
      }
    },

    async setNewPassword(command: SetNewPasswordCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'password_update',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'token';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'database';

      try {
        if (!command.token) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        stage = 'request';
        const parsedCommand = NewPasswordSchema.safeParse({
          password: command.password,
          confirm: command.confirm,
        });
        if (!parsedCommand.success) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_fields' },
          );
        }

        stage = 'token';
        const resetToken = await dependencies.tokens.consumePasswordReset(
          command.token,
          dependencies.clock.now(),
        );
        if (resetToken.status === 'invalid') {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        if (resetToken.status === 'expired') {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'token_expired' },
          );
        }

        stage = 'account';
        const user = resetToken.userId
          ? await dependencies.users.findById(resetToken.userId)
          : await dependencies.users.findByEmail(resetToken.email);
        if (!user) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        const hashedPassword = await runAuthenticationStep(
          attempt,
          stage,
          'unexpected',
          () => dependencies.passwords.hash(parsedCommand.data.password),
        );
        await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.users.updatePassword(user.id, hashedPassword),
        );
        stage = 'session';
        await dependencies.security.revokeAllSessions(user.id, 'password_reset');
        dependencies.audit.log('new_password_success', {}, 'info');
        return completeAuthenticationAttempt(
          attempt,
          stage,
          { status: 'success', code: 'password_updated' },
        );
      } catch (error) {
        failAuthenticationAttempt(attempt, stage, failureCategory);
        throw error;
      }
    },

    async verifyEmail(command: VerifyEmailCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'email_verification',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'token';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'database';

      try {
        if (!command.token) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        const verificationToken = await dependencies.tokens.consumeVerification(
          command.token,
          dependencies.clock.now(),
        );
        if (verificationToken.status === 'invalid') {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        if (verificationToken.status === 'expired') {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'token_expired' },
          );
        }

        stage = 'account';
        const user = verificationToken.userId
          ? await dependencies.users.findById(verificationToken.userId)
          : await dependencies.users.findByEmail(verificationToken.email);
        if (!user) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_token' },
          );
        }
        const verifiedAt = dependencies.clock.now();
        const verifiedEmail = verificationToken.targetEmail ?? verificationToken.email;
        const emailWasVerified = await dependencies.users.verifyEmail(
          user.id,
          verifiedEmail,
          verifiedAt,
        );
        if (!emailWasVerified) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'email_in_use' },
          );
        }
        if (verificationToken.targetEmail) {
          stage = 'session';
          await dependencies.security.revokeAllSessions(user.id, 'email_changed');
        }
        dependencies.audit.log('new_verification_success', {}, 'info');
        return completeAuthenticationAttempt(
          attempt,
          stage,
          { status: 'success', code: 'email_verified' },
        );
      } catch (error) {
        failAuthenticationAttempt(attempt, stage, failureCategory);
        throw error;
      }
    },

    async login(command: LoginCommand): Promise<AuthResult> {
      const attempt = dependencies.telemetry.start({
        flow: 'login',
        component: 'authentication.service',
      });
      let stage: AuthenticationTelemetryRecord['stage'] = 'request';
      const failureCategory: NonNullable<AuthenticationTelemetryRecord['errorCategory']> = 'unexpected';

      try {
        const parsedCommand = LoginSchema.safeParse({
          ...command,
          email: normalizeAuthEmail(command.email),
        });

        if (!parsedCommand.success) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_fields' },
          );
        }

        const { email, password } = parsedCommand.data;
        const throttleResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.throttle.consume('login', email),
        );
        if (!throttleResult.allowed) {
          dependencies.audit.log('auth_rate_limited', {
            scope: 'login',
            retryAfterSeconds: throttleResult.retryAfterSeconds,
          }, 'warn');
          return completeAuthenticationAttempt(attempt, stage, rateLimited(throttleResult));
        }

        stage = 'credentials';
        const user = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => dependencies.users.findByEmail(email),
        );
        if (!user?.email || !user.hashedPassword) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_credentials' },
          );
        }
        const storedPassword = user.hashedPassword;
        const passwordValid = await runAuthenticationStep(
          attempt,
          stage,
          'credentials',
          () => dependencies.passwords.verify(password, storedPassword),
        );
        if (!passwordValid || user.isBlocked) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            { status: 'rejected', code: 'invalid_credentials' },
          );
        }
        const verificationResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => resendVerificationFor(user, email),
        );
        if (verificationResult) {
          return completeAuthenticationAttempt(
            attempt,
            stage,
            verificationResult,
            verificationResult.status === 'success' ? 'challenge' : 'success',
          );
        }

        stage = 'mfa';
        const twoFactorResult = await runAuthenticationStep(
          attempt,
          stage,
          'database',
          () => resolveTwoFactor(user, email, parsedCommand.data),
        );
        if (twoFactorResult) {
          return completeAuthenticationAttempt(attempt, stage, twoFactorResult);
        }

        return await completeCredentialSignIn(attempt, email, password);
      } catch (error) {
        if (dependencies.session.isRedirectError(error)) {
          attempt.complete({
            stage: 'session',
            outcome: 'success',
            reasonCode: 'signed_in',
            retryable: false,
          });
        } else {
          failAuthenticationAttempt(attempt, stage, failureCategory);
        }
        throw error;
      }
    },
  };
}
