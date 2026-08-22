"use client";

import { SyntheticEvent, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';

type ApprovalResult = 'rejected' | 'unauthenticated';

export const QrDeviceApproval = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [approvalSecret] = useState(() => searchParams.get('pair') ?? '');
  const [manualCode, setManualCode] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    setResult(null);
    startTransition(() => {
      const payload = approvalSecret
        ? { approvalSecret, password, ...(mfaCode && { mfaCode }) }
        : { manualCode, password, ...(mfaCode && { mfaCode }) };
      fetch('/api/auth/qr/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
        .then((response) => {
          if (response.status === 401) return 'unauthenticated' as const;
          return response.ok ? 'approved' as const : 'rejected' as const;
        })
        .then((approvalResult) => {
          if (approvalResult === 'approved') {
            router.replace('/settings');
            return;
          }
          setResult(approvalResult);
        })
        .catch(() => setResult('rejected'));
    });
  };

  let resultMessage: string | undefined;
  if (result === 'unauthenticated') {
    resultMessage = t('Sign in on this phone first, then return to approve the other device.');
  } else if (result === 'rejected') {
    resultMessage = t('This sign-in request could not be approved. Check the code and your recent authentication.');
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-white">{t('Approve device sign-in')}</h1>
        <p className="text-sm text-zinc-400">{t('Confirm this sign-in from a phone where you are already signed in.')}</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        {!approvalSecret && (
          <label className="block space-y-2 text-sm font-medium text-zinc-200">
            <span>{t('Manual code')}</span>
            <input
              required
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder="ABCD-EFGH-JKLM-NPQR"
              autoCapitalize="characters"
              autoComplete="one-time-code"
              className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 font-mono tracking-wider text-white outline-none focus:border-red-400"
            />
            <span className="block font-normal text-zinc-400">{t('Enter the code shown on the other device.')}</span>
          </label>
        )}
        <label className="block space-y-2 text-sm font-medium text-zinc-200">
          <span>{t('Current password')}</span>
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 text-white outline-none focus:border-red-400"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-zinc-200">
          <span>{t('Optional MFA or recovery code')}</span>
          <input
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            autoComplete="one-time-code"
            className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.05] px-3 text-white outline-none focus:border-red-400"
          />
        </label>
        <Button type="submit" variant="auth" size="lg" className="h-12 w-full rounded-xl" disabled={isPending}>
          {isPending ? t('Approving…') : t('Approve sign-in')}
        </Button>
      </form>
      <FormError message={resultMessage} />
    </section>
  );
};
