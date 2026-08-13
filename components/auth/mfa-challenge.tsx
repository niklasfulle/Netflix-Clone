"use client";

import { useEffect, useState, type SyntheticEvent } from 'react';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';

import { AuthInput } from '@/components/auth/auth-input';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import type { AuthResult } from '@/lib/authentication/contracts';

type ChallengeResult = Extract<AuthResult, { status: 'challenge' }>;

type MfaChallengeProps = Readonly<{
  challenge: ChallengeResult;
  isPending: boolean;
  error?: string;
  onSubmit(code: string, method: 'totp' | 'email_otp'): void;
  onRequestEmail(): void;
  onResendEmail(): void;
  onBack(): void;
}>;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function useEmailChallengeCountdown(challenge: ChallengeResult) {
  const isEmailChallenge = challenge.challenge === 'email_otp';
  const [expiresIn, setExpiresIn] = useState(isEmailChallenge ? challenge.expiresInSeconds : 0);
  const [resendIn, setResendIn] = useState(isEmailChallenge ? challenge.resendAfterSeconds : 0);

  useEffect(() => {
    if (challenge.challenge !== 'email_otp') return undefined;
    setExpiresIn(challenge.expiresInSeconds);
    setResendIn(challenge.resendAfterSeconds);
    const timer = globalThis.setInterval(() => {
      setExpiresIn((current) => Math.max(0, current - 1));
      setResendIn((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => globalThis.clearInterval(timer);
  }, [challenge]);

  return { expiresIn, resendIn };
}

function submitMfaCode(
  event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  code: string,
  method: 'totp' | 'email_otp',
  onSubmit: MfaChallengeProps['onSubmit'],
) {
  event.preventDefault();
  const normalizedCode = code.trim();
  if (normalizedCode) onSubmit(normalizedCode, method);
}

function MfaChallengeDescription({
  challenge,
  isRecovery,
}: Readonly<{ challenge: ChallengeResult; isRecovery: boolean }>) {
  const { t } = useLanguage();
  if (challenge.challenge === 'email_otp') {
    return (
      <p className="text-sm text-zinc-400">
        {t('We sent a code to')}{' '}
        <strong className="text-zinc-200">{challenge.maskedDestination}</strong>
      </p>
    );
  }

  const description = isRecovery
    ? t('Enter one of your unused recovery codes.')
    : t('Enter the current code from your authenticator app.');
  return <p className="text-sm text-zinc-400">{description}</p>;
}

export function MfaChallenge({
  challenge,
  isPending,
  error,
  onSubmit,
  onRequestEmail,
  onResendEmail,
  onBack,
}: MfaChallengeProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const { expiresIn, resendIn } = useEmailChallengeCountdown(challenge);

  const isEmail = challenge.challenge === 'email_otp';
  const isRecovery = !isEmail && useRecoveryCode;
  let label = t('Authenticator code');
  if (isRecovery) label = t('Recovery code');
  else if (isEmail) label = t('Email verification code');

  return (
    <section aria-labelledby="mfa-challenge-title" className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>
        <h2 id="mfa-challenge-title" className="text-2xl font-semibold text-white">
          {t('Two-step verification')}
        </h2>
        <MfaChallengeDescription challenge={challenge} isRecovery={isRecovery} />
      </div>

      <form
        method="post"
        onSubmit={(event) => submitMfaCode(event, code, challenge.challenge, onSubmit)}
        className="space-y-4"
      >
        <label htmlFor="mfa-code" className="block text-sm font-medium text-zinc-200">
          {label}
        </label>
        <AuthInput
          id="mfa-code"
          icon={isEmail ? Mail : KeyRound}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={isPending || (isEmail && expiresIn === 0)}
          type="text"
          inputMode={isRecovery ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={isRecovery ? 20 : 6}
          placeholder={isRecovery ? 'AAAA-BBBB-CCCC' : '123456'}
        />
        {isEmail && (
          <p className="text-xs text-zinc-500" aria-live="polite">
            {expiresIn > 0
              ? `${t('Code expires in')} ${formatCountdown(expiresIn)}`
              : t('This code has expired.')}
          </p>
        )}
        <Button type="submit" variant="auth" size="lg" disabled={isPending || !code.trim()}>
          {isPending ? t('Confirming…') : t('Confirm')}
        </Button>
      </form>

      <FormError message={error} />

      <div className="flex flex-col items-center gap-2 text-sm">
        {!isEmail && (
          <Button
            type="button"
            variant="link_dark"
            onClick={() => {
              setCode('');
              setUseRecoveryCode((current) => !current);
            }}
            disabled={isPending}
          >
            {useRecoveryCode ? t('Use authenticator code') : t('Use a recovery code')}
          </Button>
        )}
        {challenge.challenge === 'totp' && challenge.canUseEmailFallback && (
          <Button type="button" variant="link_dark" onClick={onRequestEmail} disabled={isPending}>
            {t('Use email code instead')}
          </Button>
        )}
        {isEmail && (
          <Button
            type="button"
            variant="link_dark"
            onClick={onResendEmail}
            disabled={isPending || resendIn > 0}
            aria-label={resendIn > 0 ? `${t('Send again in')} ${resendIn}s` : t('Send again')}
          >
            {resendIn > 0 ? `${t('Send again in')} ${resendIn}s` : t('Send again')}
          </Button>
        )}
        <Button type="button" variant="link_dark" onClick={onBack} disabled={isPending}>
          {t('Back to sign in')}
        </Button>
      </div>
    </section>
  );
}
