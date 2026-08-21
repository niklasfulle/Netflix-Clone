import type { AuthResultCode } from './contracts';

type AuthenticationOperationReasonCode =
  | 'unauthorized'
  | 'session_unavailable'
  | 'signed_out'
  | 'other_sessions_revoked'
  | 'reauthentication_required'
  | 'mfa_already_enabled'
  | 'mfa_not_enabled'
  | 'mfa_setup_missing'
  | 'mfa_setup_expired'
  | 'invalid_mfa_code'
  | 'mfa_enrollment_started'
  | 'mfa_enabled'
  | 'mfa_disabled';
type AuthenticationLifecycleReasonCode =
  | 'settings_updated'
  | 'profile_selected'
  | 'account_missing'
  | 'session_created'
  | 'session_validated'
  | 'session_expired'
  | 'session_revoked'
  | 'session_rotated'
  | 'provider_request_completed'
  | 'provider_request_rejected'
  | 'provider_failure'
  | 'mail_delivered';
type CertificateReasonCode =
  | 'certificate_metadata_loaded'
  | 'certificate_downloaded'
  | 'certificate_unavailable'
  | 'origin_rejected';

export type AuthenticationTelemetryRecord = {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  category: 'authentication';
  environment: string;
  version: string;
  correlationId: string;
  flow:
    | 'login'
    | 'registration'
    | 'password_reset_request'
    | 'verification_resend'
    | 'password_update'
    | 'email_verification'
    | 'logout'
    | 'session_revocation'
    | 'mfa_enrollment'
    | 'mfa_management'
    | 'account_settings'
    | 'profile_handoff'
    | 'session_lifecycle'
    | 'provider_request'
    | 'mail_delivery'
    | 'certificate_metadata'
    | 'certificate_download';
  stage: 'request' | 'credentials' | 'account' | 'token' | 'mail' | 'mfa' | 'session';
  outcome: 'started' | 'success' | 'rejected' | 'retry' | 'challenge' | 'failed';
  reasonCode:
    | 'attempt_started'
    | 'unexpected_failure'
    | AuthResultCode
    | AuthenticationOperationReasonCode
    | AuthenticationLifecycleReasonCode
    | CertificateReasonCode;
  component:
    | 'authentication.service'
    | 'authentication.action'
    | 'authentication.callback'
    | 'authentication.route';
  retryable: boolean;
  durationMs?: number;
  httpStatus?: number;
  errorCategory?:
    | 'validation'
    | 'credentials'
    | 'rate_limit'
    | 'mail'
    | 'provider'
    | 'database'
    | 'configuration'
    | 'unexpected';
};

type AuthenticationTelemetryDependencies = {
  write(record: AuthenticationTelemetryRecord): void;
  now(): Date;
  randomUUID(): string;
  environment: string;
  version: string;
};

type AuthenticationCompletion = Pick<
  AuthenticationTelemetryRecord,
  'stage' | 'outcome' | 'reasonCode' | 'retryable'
> & {
  errorCategory?: AuthenticationTelemetryRecord['errorCategory'];
  httpStatus?: number;
};

const AUTH_REASON_CODES = new Set<AuthenticationTelemetryRecord['reasonCode']>([
  'attempt_started',
  'unexpected_failure',
  'signed_in',
  'verification_sent',
  'password_reset_sent',
  'password_updated',
  'email_verified',
  'invalid_fields',
  'invalid_credentials',
  'invalid_code',
  'invalid_token',
  'code_expired',
  'token_expired',
  'email_in_use',
  'delivery_failed',
  'auth_failed',
  'rate_limited',
  'two_factor_required',
  'unauthorized',
  'session_unavailable',
  'signed_out',
  'other_sessions_revoked',
  'reauthentication_required',
  'mfa_already_enabled',
  'mfa_not_enabled',
  'mfa_setup_missing',
  'mfa_setup_expired',
  'invalid_mfa_code',
  'mfa_enrollment_started',
  'mfa_enabled',
  'mfa_disabled',
  'settings_updated',
  'profile_selected',
  'account_missing',
  'session_created',
  'session_validated',
  'session_expired',
  'session_revoked',
  'session_rotated',
  'provider_request_completed',
  'provider_request_rejected',
  'provider_failure',
  'mail_delivered',
  'certificate_metadata_loaded',
  'certificate_downloaded',
  'certificate_unavailable',
  'origin_rejected',
]);

function allowListedReasonCode(value: unknown): AuthenticationTelemetryRecord['reasonCode'] {
  return typeof value === 'string'
    && AUTH_REASON_CODES.has(value as AuthenticationTelemetryRecord['reasonCode'])
    ? value as AuthenticationTelemetryRecord['reasonCode']
    : 'unexpected_failure';
}

function levelFor(outcome: AuthenticationCompletion['outcome']): AuthenticationTelemetryRecord['level'] {
  if (outcome === 'failed') return 'error';
  if (outcome === 'retry') return 'warn';
  return 'info';
}

export function createAuthenticationTelemetry(dependencies: AuthenticationTelemetryDependencies) {
  const writeSafely = (record: AuthenticationTelemetryRecord) => {
    try {
      dependencies.write(record);
    } catch {
      // Authentication remains available when its optional diagnostics sink is unavailable.
    }
  };

  return {
    start(input: {
      flow: AuthenticationTelemetryRecord['flow'];
      component: AuthenticationTelemetryRecord['component'];
    }) {
      const startedAt = dependencies.now();
      const correlationId = dependencies.randomUUID();
      let completed = false;

      writeSafely({
        timestamp: startedAt.toISOString(),
        level: 'info',
        action: `auth.${input.flow}.started`,
        category: 'authentication',
        environment: dependencies.environment,
        version: dependencies.version,
        correlationId,
        flow: input.flow,
        stage: 'request',
        outcome: 'started',
        reasonCode: 'attempt_started',
        component: input.component,
        retryable: false,
      });

      return {
        correlationId,
        complete(completion: AuthenticationCompletion) {
          if (completed) return;
          completed = true;
          const completedAt = dependencies.now();
          const record: AuthenticationTelemetryRecord = {
            timestamp: completedAt.toISOString(),
            level: levelFor(completion.outcome),
            action: `auth.${input.flow}.completed`,
            category: 'authentication',
            environment: dependencies.environment,
            version: dependencies.version,
            correlationId,
            flow: input.flow,
            stage: completion.stage,
            outcome: completion.outcome,
            reasonCode: allowListedReasonCode(completion.reasonCode),
            component: input.component,
            retryable: completion.retryable,
            durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
          };
          if (completion.errorCategory) record.errorCategory = completion.errorCategory;
          if (completion.httpStatus !== undefined) {
            record.httpStatus = Math.min(599, Math.max(100, Math.trunc(completion.httpStatus)));
          }
          writeSafely(record);
        },
      };
    },
  };
}

export type AuthenticationTelemetry = ReturnType<typeof createAuthenticationTelemetry>;
export type AuthenticationTelemetryAttempt = ReturnType<AuthenticationTelemetry['start']>;
