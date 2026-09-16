"use client";

import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/components/providers/LanguageProvider';

const CHECK_INTERVAL_MS = 60_000;
const DISMISSED_VERSION_KEY = 'netflix-dismissed-deployment-version';
const OPEN_MODAL_SELECTOR = 'dialog[open], [role="dialog"][aria-modal="true"]:not([hidden])';

type DeploymentUpdateNoticeProps = Readonly<{
  currentVersion: string;
  reloadPage?: () => void;
}>;

type HealthResponse = {
  status?: string;
  version?: string;
  deploymentUpdates?: {
    automaticReloadEnabled?: boolean;
  };
};

const reloadCurrentPage = () => globalThis.location.reload();

export default function DeploymentUpdateNotice({
  currentVersion,
  reloadPage = reloadCurrentPage,
}: DeploymentUpdateNoticeProps) {
  const { t } = useLanguage();
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const reloadTriggeredRef = useRef(false);

  useEffect(() => {
    let active = true;

    const checkForUpdate = async () => {
      if (document.visibilityState === 'hidden') return;

      try {
        const response = await fetch('/api/health', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;

        const health = await response.json() as HealthResponse;
        const deployedVersion = health.version?.trim();
        if (!active || health.status !== 'ok') return;
        if (health.deploymentUpdates?.automaticReloadEnabled === false) {
          setAvailableVersion(null);
          return;
        }
        if (
          !deployedVersion
          || deployedVersion === currentVersion
          || sessionStorage.getItem(DISMISSED_VERSION_KEY) === deployedVersion
        ) {
          return;
        }

        if (!document.querySelector(OPEN_MODAL_SELECTOR)) {
          if (!reloadTriggeredRef.current) {
            reloadTriggeredRef.current = true;
            reloadPage();
          }
          return;
        }

        setAvailableVersion(deployedVersion);
      } catch {
        // Deployments briefly make the health endpoint unavailable. Retry later.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkForUpdate();
    };

    void checkForUpdate();
    const intervalId = globalThis.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      globalThis.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion, reloadPage]);

  if (!availableVersion) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_VERSION_KEY, availableVersion);
    setAvailableVersion(null);
  };

  return (
    <output
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[110] mx-auto block max-w-xl rounded-2xl border border-red-500/40 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/60 backdrop-blur sm:flex sm:items-center sm:gap-4"
    >
      <span className="block min-w-0 flex-1">
        <span className="block font-semibold">{t('New version available')}</span>
        <span className="mt-1 block text-sm text-zinc-400">
          {t('Reload to use the latest changes.')} <span className="text-zinc-300">{availableVersion}</span>
        </span>
      </span>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          {t('Later')}
        </button>
        <button
          type="button"
          onClick={reloadPage}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          {t('Reload now')}
        </button>
      </div>
    </output>
  );
}
