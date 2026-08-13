import {
  LoginSchema,
  NewPasswordSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '@/schemas';

import { normalizeAuthEmail, type AuthResult } from './contracts';

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

    dependencies.audit.log('login_confirmation_sent', { identity: email }, 'info');
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
      dependencies.audit.log('login_invalid_code', { identity: email }, 'error');
      return { status: 'rejected', code: 'invalid_code' };
    }
    dependencies.audit.log('login_mfa_consumed', {
      identity: email,
      method: consumedMethod,
    }, 'info');
    return null;
  };

  const consumeEmailCode = async (email: string, code: string): Promise<AuthResult | null> => {
    const storedToken = await dependencies.tokens.consumeTwoFactor(
      email,
      code,
      dependencies.clock.now(),
    );
    if (storedToken.status === 'invalid') {
      dependencies.audit.log('login_invalid_code', { identity: email }, 'error');
      return { status: 'rejected', code: 'invalid_code' };
    }
    if (storedToken.status === 'expired') {
      dependencies.audit.log('login_code_expired', { identity: email }, 'error');
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

    dependencies.audit.log('login_two_factor_sent', { identity: email }, 'info');
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
        dependencies.audit.log('login_success', { identity: email }, 'info');
        throw error;
      }
      dependencies.audit.log('login_auth_error', { identity: email }, 'error');
      return { status: 'rejected', code: 'auth_failed' };
    }

    await dependencies.throttle.release('login', email);
    dependencies.audit.log('login_success', { identity: email }, 'info');
    return { status: 'success', code: 'signed_in' };
  };

  return {
    async register(command: RegisterCommand): Promise<AuthResult> {
      const parsedCommand = RegisterSchema.safeParse({
        ...command,
        email: normalizeAuthEmail(command.email),
      });

      if (!parsedCommand.success) {
        dependencies.audit.log('register_invalid_fields', {
          invalidFields: parsedCommand.error.issues.map((issue) => issue.path.join('.')),
        }, 'error');
        return { status: 'rejected', code: 'invalid_fields' };
      }

      const { name, email, password } = parsedCommand.data;
      const throttleResult = await dependencies.throttle.consume('register', email);
      if (!throttleResult.allowed) {
        dependencies.audit.log('auth_rate_limited', {
          scope: 'register',
          keyHash: throttleResult.keyHash,
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        }, 'warn');
        return {
          status: 'retry',
          code: 'rate_limited',
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        };
      }

      const existingUser = await dependencies.users.findByEmail(email);
      if (existingUser) {
        dependencies.audit.log('register_request_accepted', { identity: email }, 'info');
        return { status: 'success', code: 'verification_sent' };
      }

      const hashedPassword = await dependencies.passwords.hash(password);
      const created = await dependencies.users.create({ name, email, hashedPassword });
      if (!created.created) {
        dependencies.audit.log('register_request_accepted', { identity: email }, 'info');
        return { status: 'success', code: 'verification_sent' };
      }
      const verificationToken = await dependencies.tokens.issueVerification(email, {
        userId: created.userId,
      });
      const delivered = await deliver(
        'verification',
        () => dependencies.mail.sendVerification(verificationToken),
      );
      if (!delivered) {
        return { status: 'rejected', code: 'delivery_failed' };
      }
      dependencies.audit.log('register_success', { identity: email }, 'info');
      return { status: 'success', code: 'verification_sent' };
    },

    async requestPasswordReset(command: PasswordResetRequestCommand): Promise<AuthResult> {
      const parsedCommand = ResetPasswordSchema.safeParse({
        email: normalizeAuthEmail(command.email),
      });
      if (!parsedCommand.success) {
        return { status: 'rejected', code: 'invalid_fields' };
      }

      const { email } = parsedCommand.data;
      const throttleResult = await dependencies.throttle.consume('password-reset', email);
      if (!throttleResult.allowed) {
        dependencies.audit.log('auth_rate_limited', {
          scope: 'password-reset',
          keyHash: throttleResult.keyHash,
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        }, 'warn');
        return {
          status: 'retry',
          code: 'rate_limited',
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        };
      }

      const existingUser = await dependencies.users.findByEmail(email);
      if (existingUser) {
        const resetToken = await dependencies.tokens.issuePasswordReset(email, existingUser.id);
        await deliver(
          'password-reset',
          () => dependencies.mail.sendPasswordReset(resetToken),
        );
      }
      dependencies.audit.log('password_reset_request_accepted', { identity: email }, 'info');
      return { status: 'success', code: 'password_reset_sent' };
    },

    async resendVerification(command: PasswordResetRequestCommand): Promise<AuthResult> {
      const parsedCommand = ResetPasswordSchema.safeParse({
        email: normalizeAuthEmail(command.email),
      });
      if (!parsedCommand.success) {
        return { status: 'rejected', code: 'invalid_fields' };
      }

      const { email } = parsedCommand.data;
      const throttleResult = await dependencies.throttle.consume('verification-resend', email);
      if (!throttleResult.allowed) {
        dependencies.audit.log('auth_rate_limited', {
          scope: 'verification-resend',
          keyHash: throttleResult.keyHash,
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        }, 'warn');
        return {
          status: 'retry',
          code: 'rate_limited',
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        };
      }

      const user = await dependencies.users.findByEmail(email);
      if (user && !user.emailVerified) {
        const verificationToken = await dependencies.tokens.issueVerification(email, {
          userId: user.id,
        });
        await deliver('verification', () => dependencies.mail.sendVerification(verificationToken));
      }
      dependencies.audit.log('verification_resend_accepted', { identity: email }, 'info');
      return { status: 'success', code: 'verification_sent' };
    },

    async setNewPassword(command: SetNewPasswordCommand): Promise<AuthResult> {
      if (!command.token) {
        return { status: 'rejected', code: 'invalid_token' };
      }
      const parsedCommand = NewPasswordSchema.safeParse({
        password: command.password,
        confirm: command.confirm,
      });
      if (!parsedCommand.success) {
        return { status: 'rejected', code: 'invalid_fields' };
      }

      const resetToken = await dependencies.tokens.consumePasswordReset(
        command.token,
        dependencies.clock.now(),
      );
      if (resetToken.status === 'invalid') {
        return { status: 'rejected', code: 'invalid_token' };
      }
      if (resetToken.status === 'expired') {
        return { status: 'rejected', code: 'token_expired' };
      }

      const user = resetToken.userId
        ? await dependencies.users.findById(resetToken.userId)
        : await dependencies.users.findByEmail(resetToken.email);
      if (!user) {
        return { status: 'rejected', code: 'invalid_token' };
      }
      const hashedPassword = await dependencies.passwords.hash(parsedCommand.data.password);
      await dependencies.users.updatePassword(user.id, hashedPassword);
      await dependencies.security.revokeAllSessions(user.id, 'password_reset');
      dependencies.audit.log('new_password_success', { identity: resetToken.email }, 'info');
      return { status: 'success', code: 'password_updated' };
    },

    async verifyEmail(command: VerifyEmailCommand): Promise<AuthResult> {
      if (!command.token) {
        return { status: 'rejected', code: 'invalid_token' };
      }
      const verificationToken = await dependencies.tokens.consumeVerification(
        command.token,
        dependencies.clock.now(),
      );
      if (verificationToken.status === 'invalid') {
        return { status: 'rejected', code: 'invalid_token' };
      }
      if (verificationToken.status === 'expired') {
        return { status: 'rejected', code: 'token_expired' };
      }

      const user = verificationToken.userId
        ? await dependencies.users.findById(verificationToken.userId)
        : await dependencies.users.findByEmail(verificationToken.email);
      if (!user) {
        return { status: 'rejected', code: 'invalid_token' };
      }
      const verifiedAt = dependencies.clock.now();
      const verifiedEmail = verificationToken.targetEmail ?? verificationToken.email;
      const emailWasVerified = await dependencies.users.verifyEmail(
        user.id,
        verifiedEmail,
        verifiedAt,
      );
      if (!emailWasVerified) {
        return { status: 'rejected', code: 'email_in_use' };
      }
      if (verificationToken.targetEmail) {
        await dependencies.security.revokeAllSessions(user.id, 'email_changed');
      }
      dependencies.audit.log('new_verification_success', {
        identity: verificationToken.email,
      }, 'info');
      return { status: 'success', code: 'email_verified' };
    },

    async login(command: LoginCommand): Promise<AuthResult> {
      const parsedCommand = LoginSchema.safeParse({
        ...command,
        email: normalizeAuthEmail(command.email),
      });

      if (!parsedCommand.success) {
        return { status: 'rejected', code: 'invalid_fields' };
      }

      const { email, password } = parsedCommand.data;
      const throttleResult = await dependencies.throttle.consume('login', email);
      if (!throttleResult.allowed) {
        dependencies.audit.log('auth_rate_limited', {
          scope: 'login',
          keyHash: throttleResult.keyHash,
          retryAfterSeconds: throttleResult.retryAfterSeconds,
        }, 'warn');
        return rateLimited(throttleResult);
      }

      const user = await dependencies.users.findByEmail(email);
      if (!user?.email || !user.hashedPassword) {
        return { status: 'rejected', code: 'invalid_credentials' };
      }
      const passwordValid = await dependencies.passwords.verify(password, user.hashedPassword);
      if (!passwordValid || user.isBlocked) {
        return { status: 'rejected', code: 'invalid_credentials' };
      }
      const verificationResult = await resendVerificationFor(user, email);
      if (verificationResult) return verificationResult;

      const twoFactorResult = await resolveTwoFactor(user, email, parsedCommand.data);
      if (twoFactorResult) return twoFactorResult;

      return signInWithCredentials(email, password);
    },
  };
}
