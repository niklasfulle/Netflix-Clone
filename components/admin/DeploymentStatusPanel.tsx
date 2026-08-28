"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  GitBranch,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type {
  DeploymentStatusOverview,
  DeploymentStatusSummary,
} from "@/lib/deployment-status";
import type { ScheduledBackupStatus } from "@/lib/backup-verification";
import type { Locale, TranslationKey } from "@/lib/i18n/translations";

type DeploymentOverviewResponse = DeploymentStatusOverview & {
  scheduledBackup: ScheduledBackupStatus | null;
};

type Translator = (key: TranslationKey) => string;

const fetcher = async (url: string): Promise<DeploymentOverviewResponse> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Deployment status could not be loaded");
  }
  return data;
};

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function summaryPresentation(summary: DeploymentStatusSummary, t: Translator) {
  if (summary.trust === "tampered") {
    return {
      label: t("Signature verification failed"),
      className: "border-red-500/30 bg-red-500/10 text-red-300",
      icon: ShieldAlert,
    };
  }
  if (summary.trust === "unavailable") {
    return {
      label: t("Status unavailable"),
      className: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
      icon: AlertTriangle,
    };
  }
  if (summary.freshness === "stale") {
    return {
      label: t("Signed status is stale"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: Clock3,
    };
  }
  if (summary.record?.result === "succeeded") {
    return {
      label: t("Verified deployment"),
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (summary.record?.result === "rolled_back") {
    return {
      label: t("Deployment rolled back"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: GitBranch,
    };
  }
  if (summary.record?.result === "failed") {
    return {
      label: t("Deployment failed"),
      className: "border-red-500/30 bg-red-500/10 text-red-300",
      icon: ShieldAlert,
    };
  }
  return {
    label: t("Deployment in progress"),
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    icon: Clock3,
  };
}

function Detail({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 py-2.5 last:border-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="max-w-[65%] break-all text-right text-xs font-medium text-zinc-200">
        {value}
      </dd>
    </div>
  );
}

function deploymentValueLabel(value: string, t: Translator) {
  const labels: Partial<Record<string, TranslationKey>> = {
    succeeded: "succeeded",
    passed: "passed",
    not_required: "not_required",
    failed: "failed",
    rolled_back: "rolled_back",
    in_progress: "in_progress",
  };
  const key = labels[value];
  return key ? t(key) : value;
}

function EnvironmentCard({
  summary,
  localEnvironment,
  locale,
  t,
}: Readonly<{
  summary: DeploymentStatusSummary;
  localEnvironment: string;
  locale: Locale;
  t: Translator;
}>) {
  const presentation = summaryPresentation(summary, t);
  const StatusIcon = presentation.icon;
  const record = summary.record;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-zinc-400">
            {summary.environment.toUpperCase()} · {summary.environment === localEnvironment ? t("LOCAL") : t("PEER")}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {t("Host-signed deployment evidence")}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${presentation.className}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {presentation.label}
        </span>
      </div>

      {record ? (
        <>
          <dl className="mt-5">
            <Detail label={t("Application version")} value={record.applicationVersion} />
            <Detail label={t("Image")} value={record.image.reference} />
            <Detail label={t("Image identity")} value={`${record.image.identity.slice(0, 19)}…`} />
            <Detail label={t("Started")} value={formatDate(record.startedAt, locale)} />
            <Detail label={t("Completed")} value={formatDate(record.completedAt, locale)} />
            <Detail label={t("Migration")} value={deploymentValueLabel(record.migrationResult, t)} />
            <Detail label={t("Rollback")} value={deploymentValueLabel(record.rollback.result, t)} />
            <Detail label={t("Backup")} value={record.backupReference ?? "—"} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2" aria-label={`${summary.environment} deployment health checks`}>
            {record.healthChecks.map((check) => (
              <span
                key={check.name}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300"
              >
                {check.name}: {deploymentValueLabel(check.result, t)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm leading-6 text-zinc-400">
          {summary.trust === "tampered"
            ? t("This record is not trusted and its payload is deliberately hidden.")
            : t("No approved signed record is currently reachable for this environment.")}
        </p>
      )}
    </article>
  );
}

function overviewWarnings(data: DeploymentOverviewResponse) {
  const verifiedRecords = data.environments
    .filter((summary) => summary.trust === "verified" && summary.record)
    .map((summary) => summary.record!);
  const versions = new Set(verifiedRecords.map((record) => record.applicationVersion));
  const production = data.environments.find((summary) => summary.environment === "production");
  const productionRecord = production?.trust === "verified" ? production.record : null;
  const promotionIncomplete = productionRecord?.result === "succeeded"
    && (
      !productionRecord.backupReference
      || productionRecord.migrationResult !== "succeeded"
      || productionRecord.healthChecks.some((check) => check.result !== "passed")
    );

  return {
    versionDrift: versions.size > 1,
    promotionIncomplete,
  };
}

export function DeploymentStatusPanel() {
  const { locale, t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR<DeploymentOverviewResponse>(
    "/api/admin/deployment-status",
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  const warnings = data ? overviewWarnings(data) : null;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("Deployment Status")}</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            {t("Integrity-protected deployment, migration, health, rollback, and recovery evidence from approved hosts.")}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => mutate()}
          aria-label={t("Refresh deployment status")}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4" />
          {t("Refresh")}
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading && !data && (
          <div className="grid gap-4 lg:grid-cols-2" aria-label={t("Deployment status is loading")}>
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/60" />
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/60" />
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message === "Deployment status could not be loaded"
              ? t("Deployment status could not be loaded")
              : error.message}
          </div>
        )}
        {data && (
          <>
            {data.scheduledBackup?.status === "FAILED" && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"
              >
                <p className="font-semibold">{t("Scheduled backup failed.")}</p>
                <p className="mt-1 font-mono text-xs text-red-200">
                  {data.scheduledBackup.diagnosticCode}
                </p>
              </div>
            )}
            {(warnings?.versionDrift || warnings?.promotionIncomplete) && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
              >
                {warnings.versionDrift && (
                  <p className="font-semibold">{t("Version drift detected between approved environments.")}</p>
                )}
                {warnings.promotionIncomplete && (
                  <p className={warnings.versionDrift ? "mt-1" : "font-semibold"}>
                    {t("Promotion evidence incomplete: production is missing a verified backup, migration, or health result.")}
                  </p>
                )}
              </div>
            )}
            {data.environments.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">
                {t("No deployment environments are configured.")}
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.environments.map((summary) => (
                  <EnvironmentCard
                    key={summary.environment}
                    summary={summary}
                    localEnvironment={data.localEnvironment}
                    locale={locale}
                    t={t}
                  />
                ))}
              </div>
            )}
            <nav aria-label={t("Deployment diagnostics")} className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link className="text-sky-300 hover:text-sky-200" href="/admin/system">
                {t("Open system diagnostics")}
              </Link>
              <Link className="text-sky-300 hover:text-sky-200" href="/admin/backups">
                {t("Open backup evidence")}
              </Link>
              <Link className="text-sky-300 hover:text-sky-200" href="/admin/logs">
                {t("Open container logs")}
              </Link>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
