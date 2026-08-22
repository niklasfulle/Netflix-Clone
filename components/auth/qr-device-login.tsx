"use client";

import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

type Pairing = {
  approvalUrl: string;
  exchangeSecret: string;
  expiresAt: string;
  manualCode: string;
  pollSecret: string;
};

type PublicPairingStatus = 'pending' | 'approved' | 'terminal';

function secondsUntil(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1_000));
}

export const QrDeviceLogin = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [status, setStatus] = useState<PublicPairingStatus | 'exchanging' | 'cancelled'>('terminal');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const exchangeStartedRef = useRef(false);

  useEffect(() => {
    if (!pairing) return;
    let stopped = false;
    const stopAt = new Date(pairing.expiresAt).getTime();

    const poll = async () => {
      if (exchangeStartedRef.current) return;
      try {
        const response = await fetch('/api/auth/qr/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pollSecret: pairing.pollSecret }),
          cache: 'no-store',
        });
        if (!response.ok || stopped) return;
        const result = await response.json() as { status?: PublicPairingStatus };
        if (result.status === 'pending') return;
        if (result.status !== 'approved') {
          setStatus('terminal');
          return;
        }
        if (stopped || exchangeStartedRef.current) return;

        exchangeStartedRef.current = true;
        setStatus('exchanging');
        const exchange = await fetch('/api/auth/qr/exchange', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ exchangeSecret: pairing.exchangeSecret }),
          cache: 'no-store',
        });
        if (!exchange.ok || stopped) {
          setError(t('QR sign-in could not be completed. Use your password or try again.'));
          setStatus('terminal');
          return;
        }
        router.replace(DEFAULT_LOGIN_REDIRECT);
        router.refresh();
      } catch {
        if (!stopped) {
          setError(t('QR sign-in could not be completed. Use your password or try again.'));
          setStatus('terminal');
        }
      }
    };

    const updateTimer = () => {
      const next = Math.max(0, Math.ceil((stopAt - Date.now()) / 1_000));
      setRemainingSeconds(next);
      if (next === 0) setStatus('terminal');
    };
    updateTimer();
    void poll();
    const pollInterval = globalThis.setInterval(() => void poll(), 2_000);
    const timerInterval = globalThis.setInterval(updateTimer, 1_000);
    return () => {
      stopped = true;
      globalThis.clearInterval(pollInterval);
      globalThis.clearInterval(timerInterval);
    };
  }, [pairing, router, t]);

  const start = () => {
    setError(undefined);
    exchangeStartedRef.current = false;
    startTransition(() => {
      fetch('/api/auth/qr', { method: 'POST', cache: 'no-store' })
        .then(async (response) => response.ok
          ? response.json() as Promise<Pairing>
          : Promise.reject(new Error('QR pairing request failed')))
        .then((nextPairing) => {
          setPairing(nextPairing);
          setRemainingSeconds(secondsUntil(nextPairing.expiresAt));
          setStatus('pending');
        })
        .catch(() => setError(t('QR sign-in could not be started. Try again or use your password.')));
    });
  };

  const cancel = () => {
    if (!pairing) return;
    exchangeStartedRef.current = true;
    fetch('/api/auth/qr/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pollSecret: pairing.pollSecret }),
      cache: 'no-store',
    }).finally(() => {
      setStatus('cancelled');
      setPairing(null);
    });
  };

  let stateText: string | undefined;
  if (status === 'exchanging') {
    stateText = t('Signing this device in…');
  } else if (status === 'pending') {
    stateText = t('Waiting for approval…');
  } else if (status === 'terminal' && pairing) {
    stateText = t('This QR sign-in request is no longer available.');
  }

  return (
    <section className="space-y-4 pt-1" aria-labelledby="qr-login-heading">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{t('or')}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      {pairing ? (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <h2 id="qr-login-heading" className="font-medium text-zinc-100">{t('Show a QR code')}</h2>
          <p className="text-sm text-zinc-400">{t('Scan this code with a signed-in phone or use the manual code.')}</p>
          <figure className="mx-auto w-fit rounded-lg bg-white p-3">
            <QRCodeSVG value={pairing.approvalUrl} size={184} title={t('QR code for signing in on this device')} />
          </figure>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{t('Manual code')}</p>
            <output className="mt-1 block font-mono text-lg font-semibold tracking-wider text-white">{pairing.manualCode}</output>
          </div>
          <output className="block text-sm text-zinc-300" aria-live="polite">
            {stateText}
            {status === 'pending' && ` ${t('QR login expires in')} ${remainingSeconds}s.`}
          </output>
          <Button type="button" variant="outline" size="sm" disabled={status === 'exchanging'} onClick={cancel}>
            {t('Cancel QR sign-in')}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 w-full rounded-xl border-white/15 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.09] hover:text-white"
          disabled={isPending}
          onClick={start}
        >
          <QrCode aria-hidden="true" className="mr-2 size-4" />
          {t('Sign in with QR code')}
        </Button>
      )}
      <FormError message={error} />
    </section>
  );
};
