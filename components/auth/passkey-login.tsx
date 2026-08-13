"use client";

import { KeyRound } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { signIn } from 'next-auth/webauthn';

import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

type PasskeyAvailability = {
  enabled: boolean;
  supported: boolean;
};

const isCancelledCeremony = (error: unknown) =>
  error instanceof DOMException && error.name === 'NotAllowedError';

export const PasskeyLogin = () => {
  const { t } = useLanguage();
  const [availability, setAvailability] = useState<PasskeyAvailability | null>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/auth/passkeys/config', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ enabled?: boolean }> : { enabled: false })
      .then(({ enabled }) => {
        setAvailability({
          enabled: enabled === true,
          supported: globalThis.PublicKeyCredential !== undefined,
        });
      })
      .catch((error_: unknown) => {
        if (!(error_ instanceof DOMException && error_.name === 'AbortError')) {
          setAvailability({ enabled: false, supported: false });
        }
      });

    return () => controller.abort();
  }, []);

  if (!availability?.enabled) return null;

  const handleSignIn = () => {
    setError(undefined);
    startTransition(() => {
      signIn('passkey', { redirectTo: DEFAULT_LOGIN_REDIRECT }).catch((error_: unknown) => {
        setError(t(isCancelledCeremony(error_)
          ? 'Passkey sign-in was cancelled. You can try again.'
          : 'Passkey sign-in failed. Use your password or try again.'));
      });
    });
  };

  const buttonLabel = isPending ? t('Waiting for your passkey…') : t('Sign in with a passkey');

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{t('or')}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 w-full rounded-xl border-white/15 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.09] hover:text-white"
        disabled={!availability.supported || isPending}
        onClick={handleSignIn}
      >
        <KeyRound aria-hidden="true" className="mr-2 size-4" />
        {buttonLabel}
      </Button>
      {!availability.supported && (
        <output className="block text-center text-sm text-amber-300">
          {t('Passkeys are not supported by this browser.')}
        </output>
      )}
      <FormError message={error} />
    </div>
  );
};
