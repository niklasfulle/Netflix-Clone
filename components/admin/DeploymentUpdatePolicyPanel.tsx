"use client";

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { useLanguage } from '@/components/providers/LanguageProvider';

type Policy = {
  automaticReloadEnabled: boolean;
};

const fetcher = async (url: string): Promise<Policy> => {
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Update policy could not be loaded.');
  return body;
};

export function DeploymentUpdatePolicyPanel() {
  const { t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR<Policy>(
    '/api/admin/deployment-updates',
    fetcher,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updatePolicy = async () => {
    if (!data || saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/admin/deployment-updates', {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automaticReloadEnabled: !data.automaticReloadEnabled,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Update policy could not be saved.');
      }
      await mutate({ automaticReloadEnabled: body.automaticReloadEnabled }, false);
    } catch (error_) {
      setSaveError(error_ instanceof Error ? error_.message : 'Update policy could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  let policyStatus = t('Disabled');
  if (saving) {
    policyStatus = t('Saving...');
  } else if (data?.automaticReloadEnabled) {
    policyStatus = t('Enabled');
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white">{t('Client update behavior')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            {t('Reload pages automatically when no modal dialog is open. Open dialogs receive an update notice instead.')}
          </p>
        </div>
        {data && (
          <button
            type="button"
            role="switch"
            aria-checked={data.automaticReloadEnabled}
            aria-label={t('Automatic page reloads')}
            disabled={saving}
            onClick={updatePolicy}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
              data.automaticReloadEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${
                data.automaticReloadEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-zinc-500">{t('Loading...')}</p>}
      {data && (
        <p className="mt-4 text-sm font-medium text-zinc-300">
          {policyStatus}
        </p>
      )}
      {(error || saveError) && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {saveError || error.message}
        </p>
      )}
    </section>
  );
}
