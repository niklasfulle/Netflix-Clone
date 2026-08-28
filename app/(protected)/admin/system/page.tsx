"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Container,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeploymentStatusPanel } from "@/components/admin/DeploymentStatusPanel";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale, TranslationKey } from "@/lib/i18n/translations";
import type {
  SystemAlert,
  SystemOverview,
  SystemSeverity,
} from "@/lib/system-monitor";

const fetcher = async (url: string): Promise<SystemOverview> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "The system overview could not be loaded.");
  }
  return data;
};

function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type Translator = (key: TranslationKey) => string;

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusPresentation(status: SystemSeverity, t: Translator) {
  if (status === "healthy") {
    return {
      label: t("All systems operational"),
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (status === "warning") {
    return {
      label: t("Warnings detected"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: AlertTriangle,
    };
  }
  return {
    label: t("Critical issues detected"),
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: ShieldAlert,
  };
}

function localizedAlert(alert: SystemAlert, t: Translator) {
  const readOnly = /^(.+) storage is read-only$/.exec(alert.title);
  const notWritable = /^(.+) is not writable\.$/.exec(alert.message);
  if (readOnly && notWritable) {
    return {
      title: `${readOnly[1]} ${t("storage is read-only")}`,
      message: `${notWritable[1]} ${t("is not writable.")}`,
    };
  }
  if (alert.id === "backup-missing") {
    return {
      title: t("No backup metadata available"),
      message: t("Create an encrypted database backup to establish a recovery point."),
    };
  }
  return { title: alert.title, message: alert.message };
}

function AlertCard({ alert, t }: Readonly<{ alert: SystemAlert; t: Translator }>) {
  const critical = alert.severity === "critical";
  const localized = localizedAlert(alert, t);
  return (
    <article
      className={`rounded-xl border p-4 ${
        critical
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {critical ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        )}
        <div>
          <h3 className="font-medium text-zinc-100">{localized.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{localized.message}</p>
        </div>
      </div>
    </article>
  );
}

function storageTone(usedPercent: number) {
  if (usedPercent >= 90) {
    return "bg-red-500";
  }
  if (usedPercent >= 80) {
    return "bg-amber-400";
  }
  return "bg-emerald-500";
}

function StorageCard({
  filesystem,
  t,
}: Readonly<{
  filesystem: SystemOverview["filesystems"][number];
  t: Translator;
}>) {
  const usedPercent = filesystem.usedPercent ?? 0;
  const tone = storageTone(usedPercent);

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold capitalize text-zinc-100">
            {filesystem.label}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{filesystem.path}</p>
        </div>
        <HardDrive className="h-5 w-5 text-zinc-500" />
      </div>
      {filesystem.available ? (
        <>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-white">
                {formatBytes(filesystem.freeBytes)}
              </p>
              <p className="text-xs text-zinc-500">{t("Available")}</p>
            </div>
            <p className="text-sm text-zinc-400">
              {usedPercent.toFixed(1)}% {t("used")}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${tone}`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-zinc-500">
            <span>{formatBytes(filesystem.usedBytes)} {t("used")}</span>
            <span>{formatBytes(filesystem.totalBytes)} {t("total")}</span>
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm font-medium text-red-300">{t("Unavailable")}</p>
      )}
    </article>
  );
}

function MetricsSection({ data, t }: Readonly<{ data: SystemOverview; t: Translator }>) {
  return (
    <section
      aria-label={t("System metrics")}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <AdminMetricCard
        label={t("Host CPU")}
        value={data.cpu ? `${data.cpu.usagePercent.toFixed(1)}%` : "—"}
        hint={
          data.cpu
            ? `${data.cpu.logicalCores} ${t("cores")} · ${t("load")} ${data.cpu.loadAverage.oneMinute}`
            : t("Monitoring agent unavailable")
        }
        icon={Cpu}
        tone={data.cpu && data.cpu.usagePercent >= 85 ? "amber" : "green"}
      />
      <AdminMetricCard
        label={t("Host memory")}
        value={data.memory ? `${data.memory.usedPercent.toFixed(1)}%` : "—"}
        hint={
          data.memory
            ? `${formatBytes(data.memory.usedBytes)} ${t("of")} ${formatBytes(data.memory.totalBytes)}`
            : t("Monitoring agent unavailable")
        }
        icon={MemoryStick}
        tone={data.memory && data.memory.usedPercent >= 85 ? "amber" : "blue"}
      />
      <AdminMetricCard
        label={t("Database latency")}
        value={
          data.database.latencyMs === null
            ? t("Unavailable")
            : `${data.database.latencyMs} ms`
        }
        hint={
          data.database.status === "ok"
            ? t("Health query successful")
            : t("Database query failed")
        }
        icon={Database}
        tone={data.database.status === "ok" ? "green" : "red"}
      />
      <AdminMetricCard
        label={t("Host uptime")}
        value={formatDuration(data.host?.uptimeSeconds)}
        hint={
          data.host
            ? `${data.host.hostname} · ${data.host.platformRelease}`
            : t("No host data")
        }
        icon={Clock3}
        tone="violet"
      />
    </section>
  );
}

function StorageSection({ data, t }: Readonly<{ data: SystemOverview; t: Translator }>) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <HardDrive className="h-5 w-5 text-red-400" />
        <h2 className="text-lg font-semibold text-white">{t("Storage")}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.filesystems.map((filesystem) => (
          <StorageCard key={filesystem.label} filesystem={filesystem} t={t} />
        ))}
        {data.filesystems.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400">
            {t("Monitoring agent unavailable")}
          </div>
        )}
      </div>
    </section>
  );
}

function RuntimeSection({
  data,
  t,
  locale,
}: Readonly<{ data: SystemOverview; t: Translator; locale: Locale }>) {
  const container = data.docker?.container;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Container className="h-5 w-5 text-sky-400" />
        <h2 className="font-semibold text-white">{t("Runtime")}</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow
          label={t("Monitoring agent")}
          value={`${runtimeValueLabel(data.agent.status, t)} · v${data.agent.version ?? "—"}`}
        />
        <DetailRow
          label={t("Last snapshot")}
          value={formatDate(data.agent.lastSeenAt, locale)}
        />
        <DetailRow
          label={t("Container status")}
          value={
            container
              ? `${runtimeValueLabel(container.status, t)} · ${runtimeValueLabel(container.health, t)}`
              : t("Unavailable")
          }
        />
        <DetailRow
          label={t("Container image")}
          value={container?.image ?? t("Unavailable")}
        />
        <DetailRow
          label={t("Container restarts")}
          value={String(container?.restartCount ?? 0)}
          icon={RotateCcw}
        />
        <DetailRow
          label={t("Container memory")}
          value={
            container
              ? `${formatBytes(container.memoryUsedBytes)} · ${container.memoryPercent.toFixed(1)}%`
              : t("Unavailable")
          }
        />
      </dl>
    </section>
  );
}

function redisStatusLabel(status: SystemOverview["redis"]["status"], t: Translator) {
  const labels = {
    ok: t("Operational"),
    degraded: t("Degraded"),
    disabled: t("Disabled"),
    closed: t("Closed"),
  };
  return labels[status];
}

function runtimeValueLabel(value: string, t: Translator) {
  const labels: Partial<Record<string, TranslationKey>> = {
    ok: "ok",
    healthy: "healthy",
    unhealthy: "unhealthy",
    running: "running",
    starting: "starting",
    unavailable: "unavailable",
    unknown: "unknown",
    UNKNOWN: "unknown",
    ACTIVE: "ACTIVE",
    DEGRADED: "DEGRADED",
    STOPPING: "STOPPING",
  };
  const key = labels[value];
  return key ? t(key) : value;
}

function RedisSection({ data, t }: Readonly<{ data: SystemOverview; t: Translator }>) {
  const { redis } = data;
  const averageLatency = redis.metrics.commands > 0
    ? `${(redis.metrics.totalLatencyMs / redis.metrics.commands).toFixed(1)} ms`
    : "—";

  return (
    <section
      aria-label={t("Redis runtime monitoring")}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
    >
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-red-400" />
        <h2 className="font-semibold text-white">{t("Redis Runtime")}</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow label={t("Status")} value={redisStatusLabel(redis.status, t)} />
        <DetailRow
          label={t("Connection")}
          value={redis.connected ? t("Connected") : t("Disconnected")}
        />
        <DetailRow
          label={t("Circuit breaker")}
          value={redis.circuit === "closed" ? t("Closed") : t("Open")}
        />
        <DetailRow label={t("Commands")} value={String(redis.metrics.commands)} />
        <DetailRow
          label={t("Cache hits / misses")}
          value={`${redis.metrics.hits} / ${redis.metrics.misses}`}
        />
        <DetailRow label={t("Average latency")} value={averageLatency} />
        <DetailRow
          label={t("Errors / timeouts")}
          value={`${redis.metrics.errors} / ${redis.metrics.timeouts}`}
        />
        <DetailRow
          label={t("Reconnects / fallbacks")}
          value={`${redis.metrics.reconnects} / ${redis.metrics.fallbacks}`}
        />
      </dl>
    </section>
  );
}

function BackgroundJobsSection({ data, t }: Readonly<{ data: SystemOverview; t: Translator }>) {
  const backgroundJobs = data.backgroundJobs ?? {
    worker: { status: "unavailable", state: "UNKNOWN", heartbeatAgeMs: null },
    queue: { depth: 0, oldestQueuedAgeMs: null },
  };
  const healthy = backgroundJobs.worker.status === "healthy";
  return (
    <section
      aria-label={t("Background job monitoring")}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
    >
      <div className="flex items-center gap-2">
        <Activity className={`h-5 w-5 ${healthy ? "text-emerald-400" : "text-amber-400"}`} />
        <h2 className="font-semibold text-white">{t("Background Jobs")}</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow label={t("Worker")} value={runtimeValueLabel(backgroundJobs.worker.status, t)} />
        <DetailRow label={t("Worker state")} value={runtimeValueLabel(backgroundJobs.worker.state, t)} />
        <DetailRow
          label={t("Heartbeat age")}
          value={backgroundJobs.worker.heartbeatAgeMs === null
            ? "—"
            : formatDuration(backgroundJobs.worker.heartbeatAgeMs / 1_000)}
        />
        <DetailRow label={t("Active queue depth")} value={String(backgroundJobs.queue.depth)} />
        <DetailRow
          label={t("Oldest queued")}
          value={backgroundJobs.queue.oldestQueuedAgeMs === null
            ? "—"
            : formatDuration(backgroundJobs.queue.oldestQueuedAgeMs / 1_000)}
        />
      </dl>
      <Link
        href="/admin/jobs"
        className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
      >
        {t("Open Job Operations")}
      </Link>
    </section>
  );
}

function RecoverySection({
  data,
  t,
  locale,
}: Readonly<{ data: SystemOverview; t: Translator; locale: Locale }>) {
  const numberLocale = locale === "de" ? "de-DE" : "en-US";
  const databaseRecords = data.backup
    ? data.backup.records.toLocaleString(numberLocale)
    : "—";
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-emerald-400" />
        <h2 className="font-semibold text-white">{t("Recovery")}</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow label={t("Application version")} value={data.version} />
        <DetailRow
          label={t("Latest database backup")}
          value={
            data.backup
              ? formatDate(data.backup.createdAt, locale)
              : t("No backup recorded")
          }
        />
        <DetailRow
          label={t("Backup size")}
          value={formatBytes(data.backup?.sizeBytes)}
        />
        <DetailRow
          label={t("Database records")}
          value={databaseRecords}
        />
        <DetailRow
          label={t("Checked at")}
          value={formatDate(data.checkedAt, locale)}
          icon={Activity}
        />
      </dl>
    </section>
  );
}

function AlertsSection({ alerts, t }: Readonly<{ alerts: SystemAlert[]; t: Translator }>) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-white">{t("Active alerts")}</h2>
        </div>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          {t("No active alerts.")}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminSystemPage() {
  const { locale, t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR<SystemOverview>(
    "/api/admin/system",
    fetcher,
    { refreshInterval: 15_000 },
  );
  const status = statusPresentation(data?.status ?? "warning", t);
  const StatusIcon = status.icon;

  return (
    <div>
      <AdminPageHeader
        title={t("System Overview")}
        description={t("Live host, container, database, Redis, background worker, storage, and backup health for this deployment.")}
        actions={
          <>
            {data && (
              <span
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${status.className}`}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                await mutate();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
              {t("Refresh")}
            </button>
          </>
        }
      />

      {isLoading && (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label={t("System metrics are loading")}
        >
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
            />
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200"
        >
          {error.message === "The system overview could not be loaded."
            ? t("The system overview could not be loaded.")
            : error.message}
        </div>
      )}

      {data && (
        <>
          <MetricsSection data={data} t={t} />
          <StorageSection data={data} t={t} />
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <RuntimeSection data={data} t={t} locale={locale} />
            <RedisSection data={data} t={t} />
            <BackgroundJobsSection data={data} t={t} />
            <RecoverySection data={data} t={t} locale={locale} />
          </div>
          <DeploymentStatusPanel />
          <AlertsSection alerts={data.alerts} t={t} />
        </>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: Readonly<{
  label: string;
  value: string;
  icon?: typeof Activity;
}>) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2 text-sm text-zinc-500">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right text-sm font-medium text-zinc-200">
        {value}
      </dd>
    </div>
  );
}
