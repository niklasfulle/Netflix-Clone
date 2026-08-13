'use client';

import { useCallback, useEffect, useState, useTransition, type ReactNode } from 'react';
import { Laptop, LoaderCircle, LogOut, ShieldCheck } from 'lucide-react';

import { getSecurityActivity, revokeOtherSessions } from '@/actions/session-security';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import type { TranslationKey } from '@/lib/i18n/translations';

type ActivityEntry = {
  id: string;
  event: string;
  createdAt: string;
  userAgent?: string | null;
};

const eventLabels: Record<string, TranslationKey> = {
  signed_in: 'Signed in',
  signed_out: 'Signed out',
  other_sessions_revoked: 'Other sessions signed out',
  password_changed: 'Password changed',
  password_reset: 'Password reset completed',
  email_changed: 'Email address changed',
  account_blocked: 'Account blocked',
  account_unblocked: 'Account unblocked',
  mfa_enabled: 'Two-factor authentication enabled',
  mfa_disabled: 'Two-factor authentication disabled',
};

export function SecurityActivityPanel() {
  const { t } = useLanguage();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadActivity = useCallback(async () => {
    const result = await getSecurityActivity();
    if (result.status === 'success') setActivity(result.activity);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const signOutOthers = () => {
    startTransition(async () => {
      const result = await revokeOtherSessions();
      if (result.status !== 'success') {
        setMessage(t('Other sessions could not be signed out.'));
        return;
      }
      setMessage(
        result.revoked === 1
          ? t('1 other session was signed out.')
          : t('{count} other sessions were signed out.').replace('{count}', String(result.revoked)),
      );
      await loadActivity();
    });
  };

  let activityContent: ReactNode;
  if (isLoading) {
    activityContent = <p className="text-sm text-zinc-500">{t('Loading security activity...')}</p>;
  } else if (activity.length === 0) {
    activityContent = <p className="text-sm text-zinc-500">{t('No security activity recorded yet.')}</p>;
  } else {
    activityContent = (
      <ul className="divide-y divide-white/[0.06]" aria-label={t('Recent security activity')}>
        {activity.map((entry) => (
          <li key={entry.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200">
                {t(eventLabels[entry.event] ?? 'Security setting changed')}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {entry.userAgent || t('Unknown device')} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-7 space-y-5 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{t('Recent security activity')}</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {t('Review recent account changes and sign-ins.')}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={signOutOthers}
          disabled={isPending}
          className="min-h-11 border-white/10 bg-transparent text-zinc-200"
        >
          {isPending
            ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            : <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />}
          {t('Sign out other devices')}
        </Button>
      </div>

      <div aria-live="polite" className="text-xs text-emerald-300">
        {message}
      </div>

      {activityContent}
    </div>
  );
}
