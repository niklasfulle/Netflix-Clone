'use client';

import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AuthResult } from '@/lib/authentication/contracts';

type AuthEmailSentProps = Readonly<{
  email: string;
  title: string;
  description: string;
  expiryHint: string;
  resendLabel: string;
  resendingLabel: string;
  resendAvailableLabel: string;
  resentLabel: string;
  errorLabel: string;
  onResend(): Promise<AuthResult>;
  initialCooldownSeconds?: number;
  resendCooldownSeconds?: number;
}>;

export function AuthEmailSent({
  email,
  title,
  description,
  expiryHint,
  resendLabel,
  resendingLabel,
  resendAvailableLabel,
  resentLabel,
  errorLabel,
  onResend,
  initialCooldownSeconds = 60,
  resendCooldownSeconds = 60,
}: AuthEmailSentProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialCooldownSeconds);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const countdown = globalThis.setInterval(() => {
      setRemainingSeconds((remaining) => Math.max(remaining - 1, 0));
    }, 1_000);
    return () => globalThis.clearInterval(countdown);
  }, [remainingSeconds]);

  const resend = async () => {
    if (pending || remainingSeconds > 0) return;
    setPending(true);
    setStatusMessage('');
    try {
      const result = await onResend();
      if (result.status === 'retry') {
        setRemainingSeconds(result.retryAfterSeconds);
        setStatusMessage(errorLabel);
      } else if (result.status === 'rejected') {
        setStatusMessage(errorLabel);
      } else {
        setRemainingSeconds(resendCooldownSeconds);
        setStatusMessage(resentLabel);
      }
    } catch {
      setStatusMessage(errorLabel);
    } finally {
      setPending(false);
    }
  };

  let buttonLabel = resendLabel;
  if (pending) {
    buttonLabel = resendingLabel;
  } else if (remainingSeconds > 0) {
    buttonLabel = `${resendAvailableLabel} ${remainingSeconds}s`;
  }

  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
        <MailCheck className="h-7 w-7 text-emerald-300" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm leading-6 text-zinc-300">{description}</p>
        <p className="break-all text-sm font-medium text-white">{email}</p>
        <p className="text-xs text-zinc-500">{expiryHint}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
        disabled={pending || remainingSeconds > 0}
        onClick={resend}
      >
        {buttonLabel}
      </Button>
      <output className="block min-h-5 text-xs text-zinc-300" aria-live="polite">
        {statusMessage}
      </output>
    </section>
  );
}
