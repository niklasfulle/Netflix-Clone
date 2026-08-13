"use client";

import { KeyRound, LoaderCircle, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { signIn } from 'next-auth/webauthn';

import {
  authorizePasskeyManagement,
  listPasskeys,
  removePasskey,
  renamePasskey,
} from '@/actions/passkeys';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PasskeyItem = {
  credentialId: string;
  label: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

type PasskeyRowProps = {
  passkey: PasskeyItem;
  pending: boolean;
  onRename(credentialId: string, label: string): Promise<void>;
  onRemove(credentialId: string): Promise<void>;
};

const inputClassName =
  'h-11 rounded-xl border-white/10 bg-black/30 px-4 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20';

const isCancelledCeremony = (error: unknown) =>
  error instanceof DOMException && error.name === 'NotAllowedError';

const PasskeyRow = ({ passkey, pending, onRename, onRemove }: PasskeyRowProps) => {
  const { t } = useLanguage();
  const [label, setLabel] = useState(passkey.label ?? '');
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

  return (
    <li className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <KeyRound className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-100">{passkey.label || t('Unnamed passkey')}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {passkey.backedUp ? t('Synced passkey') : t('Device-bound passkey')}
            {' · '}
            {t('Created')} {formatter.format(new Date(passkey.createdAt))}
          </p>
          {passkey.lastUsedAt && (
            <p className="text-xs leading-5 text-zinc-600">
              {t('Last used')} {formatter.format(new Date(passkey.lastUsedAt))}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`passkey-${passkey.credentialId}`}>
          {t('Passkey name')}
        </label>
        <Input
          id={`passkey-${passkey.credentialId}`}
          value={label}
          maxLength={64}
          disabled={pending}
          onChange={(event) => setLabel(event.target.value)}
          className={inputClassName}
          placeholder={t('Passkey name')}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !label.trim() || label.trim() === passkey.label}
          onClick={() => onRename(passkey.credentialId, label)}
          aria-label={t('Save passkey name')}
          className="h-11 shrink-0 rounded-xl border-white/10 bg-white/[0.04]"
        >
          <Pencil className="mr-2 size-4" aria-hidden="true" />
          {t('Save')}
        </Button>
      </div>

      {confirmingRemoval ? (
        <div className="flex flex-col gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-100">{t('Remove this passkey from your account?')}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmingRemoval(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => onRemove(passkey.credentialId)}
              aria-label={t('Confirm passkey removal')}
            >
              {t('Remove')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setConfirmingRemoval(true)}
          aria-label={t('Remove passkey')}
          className="h-auto px-0 py-1 text-red-300 hover:bg-transparent hover:text-red-200"
        >
          <Trash2 className="mr-2 size-4" aria-hidden="true" />
          {t('Remove passkey')}
        </Button>
      )}
    </li>
  );
};

export const PasskeySettingsPanel = () => {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const refreshPasskeys = useCallback(async () => {
    const result = await listPasskeys();
    if (result.status === 'success') {
      setPasskeys(result.passkeys);
      setUnlocked(true);
      return true;
    }
    setUnlocked(false);
    return false;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/passkeys/config', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ enabled?: boolean }> : { enabled: false })
      .then(async (runtime) => {
        if (runtime.enabled !== true) return;
        setEnabled(true);
        setSupported(globalThis.PublicKeyCredential !== undefined);
        await refreshPasskeys();
      })
      .catch((error_: unknown) => {
        if (!(error_ instanceof DOMException && error_.name === 'AbortError')) setEnabled(false);
      });
    return () => controller.abort();
  }, [refreshPasskeys]);

  if (!enabled) return null;

  const authorize = () => {
    setError(undefined);
    startTransition(() => {
      authorizePasskeyManagement(password)
        .then(async (result) => {
          if (result.status !== 'authorized') {
            setError(t(result.code === 'invalid_password'
              ? 'The current password is incorrect.'
              : 'Passkey settings could not be unlocked.'));
            return;
          }
          setPassword('');
          await refreshPasskeys();
        })
        .catch(() => setError(t('Passkey settings could not be unlocked.')));
    });
  };

  const addPasskey = () => {
    setError(undefined);
    startTransition(() => {
      signIn('passkey', {
        action: 'register',
        redirectTo: '/settings#security',
      }).catch((error_: unknown) => {
        setError(t(isCancelledCeremony(error_)
          ? 'Passkey setup was cancelled. Your account was not changed.'
          : 'Passkey setup failed. You can try again.'));
      });
    });
  };

  const rename = async (credentialId: string, label: string) => {
    setError(undefined);
    const result = await renamePasskey(credentialId, label);
    if (result.status === 'success') {
      setPasskeys((current) => current.map((passkey) => passkey.credentialId === credentialId
        ? { ...passkey, label: label.trim() }
        : passkey));
      return;
    }
    if (result.code === 'reauthentication_required') setUnlocked(false);
    setError(t(result.code === 'invalid_label'
      ? 'Choose a passkey name between 1 and 64 characters.'
      : 'The passkey name could not be saved.'));
  };

  const remove = async (credentialId: string) => {
    setError(undefined);
    const result = await removePasskey(credentialId);
    if (result.status === 'success') {
      setPasskeys((current) => current.filter((passkey) => passkey.credentialId !== credentialId));
      return;
    }
    if (result.code === 'reauthentication_required') setUnlocked(false);
    setError(t(result.code === 'last_sign_in_method'
      ? 'Keep at least one passkey, password, or connected sign-in method.'
      : 'The passkey could not be removed.'));
  };

  return (
    <div className="mt-7 border-t border-white/10 pt-7">
      <div className="mb-5 flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100">{t('Passkeys')}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {t('Use your device lock, fingerprint, or face to sign in without typing a password.')}
          </p>
        </div>
      </div>

      {!supported && (
        <output className="block rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-amber-100">
          {t('Passkeys are not supported by this browser.')}
        </output>
      )}

      {supported && !unlocked && (
        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <div>
            <label htmlFor="passkey-current-password" className="text-sm font-medium text-zinc-200">
              {t('Current password for passkeys')}
            </label>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {t('Confirm your password to manage passkeys for the next five minutes.')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="passkey-current-password"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={isPending}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  authorize();
                }
              }}
              className={inputClassName}
            />
            <Button
              type="button"
              disabled={isPending || !password}
              onClick={authorize}
              className="h-11 shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500"
            >
              {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />}
              {t('Unlock passkey settings')}
            </Button>
          </div>
        </div>
      )}

      {supported && unlocked && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-100">{t('Passkey management is unlocked')}</p>
              <p className="mt-1 text-xs text-violet-200/60">{t('This access expires automatically after five minutes.')}</p>
            </div>
            <Button
              type="button"
              disabled={isPending}
              onClick={addPasskey}
              className="h-11 shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500"
            >
              <Plus className="mr-2 size-4" aria-hidden="true" />
              {t('Add a passkey')}
            </Button>
          </div>

          {passkeys.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
              {t('No passkeys are registered yet.')}
            </p>
          ) : (
            <ul className="space-y-3">
              {passkeys.map((passkey) => (
                <PasskeyRow
                  key={passkey.credentialId}
                  passkey={passkey}
                  pending={isPending}
                  onRename={rename}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
};
