"use client";

import { useState, useTransition } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { beginTotpEnrollment, confirmTotpEnrollment, disableMfa } from '@/actions/mfa';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MfaSettingsPanelProps = Readonly<{
  initiallyEnabled: boolean;
  onSessionRefresh(): unknown;
}>;

const inputClassName =
  'h-11 rounded-xl border-white/10 bg-black/30 px-4 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20';

export function MfaSettingsPanel({
  initiallyEnabled,
  onSessionRefresh,
}: MfaSettingsPanelProps) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const beginEnrollment = () => {
    startTransition(async () => {
      const result = await beginTotpEnrollment({ password });
      if (result.status === 'rejected') {
        toast.error(t('Reauthentication failed.'));
        return;
      }
      setSetup(result.setup);
      setCode('');
      toast.success(t('Authenticator setup started.'));
    });
  };

  const confirmEnrollment = () => {
    startTransition(async () => {
      const result = await confirmTotpEnrollment({ code });
      if (result.status === 'rejected') {
        toast.error(t('The MFA code is invalid or the setup expired.'));
        return;
      }
      setEnabled(true);
      setSetup(null);
      setPassword('');
      setCode('');
      setRecoveryCodes(result.recoveryCodes);
      await onSessionRefresh();
      toast.success(t('Multi-factor authentication enabled.'));
    });
  };

  const disableProtection = () => {
    startTransition(async () => {
      const result = await disableMfa({ password, code });
      if (result.status === 'rejected') {
        toast.error(t('Password or MFA code is incorrect.'));
        return;
      }
      setEnabled(false);
      setPassword('');
      setCode('');
      await onSessionRefresh();
      toast.success(t('Multi-factor authentication disabled.'));
    });
  };

  if (recoveryCodes.length > 0) {
    return (
      <div className="space-y-5 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
        <div className="flex gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-amber-100">{t('Save your recovery codes')}</h3>
            <p className="mt-1 text-xs leading-5 text-amber-100/70">
              {t('Each recovery code works once. They will not be shown again.')}
            </p>
          </div>
        </div>
        <ul className="grid gap-2 rounded-xl bg-black/30 p-4 font-mono text-sm text-zinc-100 sm:grid-cols-2">
          {recoveryCodes.map((recoveryCode) => (
            <li key={recoveryCode}><code>{recoveryCode}</code></li>
          ))}
        </ul>
        <Button type="button" onClick={() => setRecoveryCodes([])} className="w-full">
          {t('I saved my recovery codes')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
          {enabled
            ? <ShieldCheck className="h-4 w-4 text-violet-400" aria-hidden="true" />
            : <ShieldOff className="h-4 w-4 text-zinc-500" aria-hidden="true" />}
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-200">{t('Two-factor authentication')}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {enabled
              ? t('Your account requires an authenticator, recovery, or email code when signing in.')
              : t('Protect your account with an authenticator app and one-time recovery codes.')}
          </p>
        </div>
      </div>

      {!setup && (
        <div className="space-y-3">
          <label htmlFor="mfa-current-password" className="block text-xs font-medium text-zinc-300">
            {t('Current password for MFA')}
          </label>
          <Input
            id="mfa-current-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            className={inputClassName}
          />
          {enabled && (
            <>
              <label htmlFor="mfa-disable-code" className="block text-xs font-medium text-zinc-300">
                {t('MFA or recovery code')}
              </label>
              <Input
                id="mfa-disable-code"
                type="text"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={isPending}
                className={inputClassName}
              />
            </>
          )}
          <Button
            type="button"
            variant={enabled ? 'destructive' : 'default'}
            disabled={isPending || !password || (enabled && !code)}
            onClick={enabled ? disableProtection : beginEnrollment}
            className="w-full sm:w-auto"
          >
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {enabled ? t('Disable MFA') : t('Set up authenticator')}
          </Button>
        </div>
      )}

      {setup && (
        <div className="space-y-4 rounded-xl border border-violet-400/20 bg-violet-400/[0.05] p-4">
          <div>
            <p className="text-sm font-medium text-zinc-200">{t('Add this account to your authenticator app')}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {t('Open the setup link or enter the secret manually.')}
            </p>
          </div>
          <a href={setup.uri} className="inline-flex text-sm font-medium text-violet-300 underline-offset-4 hover:underline">
            {t('Open authenticator setup')}
          </a>
          <code className="block break-all rounded-lg bg-black/40 p-3 text-sm text-zinc-100">
            {setup.secret}
          </code>
          <label htmlFor="mfa-setup-code" className="block text-xs font-medium text-zinc-300">
            {t('Authenticator setup code')}
          </label>
          <Input
            id="mfa-setup-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={isPending}
            className={inputClassName}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={confirmEnrollment} disabled={isPending || code.length !== 6}>
              {t('Verify and enable')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSetup(null);
                setCode('');
              }}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
