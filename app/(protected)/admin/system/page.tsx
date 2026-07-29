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
import useSWR from "swr";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusPresentation(status: SystemSeverity) {
  if (status === "healthy") {
    return {
      label: "All systems operational",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: CheckCircle2,
    };
  }
  if (status === "warning") {
    return {
      label: "Warnings detected",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: AlertTriangle,
    };
  }
  return {
    label: "Critical issues detected",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: ShieldAlert,
  };
}

function AlertCard({ alert }: Readonly<{ alert: SystemAlert }>) {
  const critical = alert.severity === "critical";
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
          <h3 className="font-medium text-zinc-100">{alert.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{alert.message}</p>
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
}: Readonly<{ filesystem: SystemOverview["filesystems"][number] }>) {
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
              <p className="text-xs text-zinc-500">Available</p>
            </div>
            <p className="text-sm text-zinc-400">
              {usedPercent.toFixed(1)}% used
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${tone}`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-zinc-500">
            <span>{formatBytes(filesystem.usedBytes)} used</span>
            <span>{formatBytes(filesystem.totalBytes)} total</span>
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm font-medium text-red-300">Unavailable</p>
      )}
    </article>
  );
}

function MetricsSection({ data }: Readonly<{ data: SystemOverview }>) {
  return (
    <section
      aria-label="System metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <AdminMetricCard
        label="Host CPU"
        value={data.cpu ? `${data.cpu.usagePercent.toFixed(1)}%` : "—"}
        hint={
          data.cpu
            ? `${data.cpu.logicalCores} cores · load ${data.cpu.loadAverage.oneMinute}`
            : "Monitoring agent unavailable"
        }
        icon={Cpu}
        tone={data.cpu && data.cpu.usagePercent >= 85 ? "amber" : "green"}
      />
      <AdminMetricCard
        label="Host memory"
        value={data.memory ? `${data.memory.usedPercent.toFixed(1)}%` : "—"}
        hint={
          data.memory
            ? `${formatBytes(data.memory.usedBytes)} of ${formatBytes(data.memory.totalBytes)}`
            : "Monitoring agent unavailable"
        }
        icon={MemoryStick}
        tone={data.memory && data.memory.usedPercent >= 85 ? "amber" : "blue"}
      />
      <AdminMetricCard
        label="Database latency"
        value={
          data.database.latencyMs === null
            ? "Unavailable"
            : `${data.database.latencyMs} ms`
        }
        hint={
          data.database.status === "ok"
            ? "Health query successful"
            : "Database query failed"
        }
        icon={Database}
        tone={data.database.status === "ok" ? "green" : "red"}
      />
      <AdminMetricCard
        label="Host uptime"
        value={formatDuration(data.host?.uptimeSeconds)}
        hint={
          data.host
            ? `${data.host.hostname} · ${data.host.platformRelease}`
            : "No host data"
        }
        icon={Clock3}
        tone="violet"
      />
    </section>
  );
}

function StorageSection({ data }: Readonly<{ data: SystemOverview }>) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <HardDrive className="h-5 w-5 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Storage</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.filesystems.map((filesystem) => (
          <StorageCard key={filesystem.label} filesystem={filesystem} />
        ))}
        {data.filesystems.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400">
            Monitoring agent unavailable
          </div>
        )}
      </div>
    </section>
  );
}

function RuntimeSection({ data }: Readonly<{ data: SystemOverview }>) {
  const container = data.docker?.container;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Container className="h-5 w-5 text-sky-400" />
        <h2 className="font-semibold text-white">Runtime</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow
          label="Monitoring agent"
          value={`${data.agent.status} · v${data.agent.version ?? "—"}`}
        />
        <DetailRow
          label="Last snapshot"
          value={formatDate(data.agent.lastSeenAt)}
        />
        <DetailRow
          label="Container status"
          value={
            container
              ? `${container.status} · ${container.health}`
              : "Unavailable"
          }
        />
        <DetailRow
          label="Container image"
          value={container?.image ?? "Unavailable"}
        />
        <DetailRow
          label="Container restarts"
          value={String(container?.restartCount ?? 0)}
          icon={RotateCcw}
        />
        <DetailRow
          label="Container memory"
          value={
            container
              ? `${formatBytes(container.memoryUsedBytes)} · ${container.memoryPercent.toFixed(1)}%`
              : "Unavailable"
          }
        />
      </dl>
    </section>
  );
}

function RecoverySection({ data }: Readonly<{ data: SystemOverview }>) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-emerald-400" />
        <h2 className="font-semibold text-white">Recovery</h2>
      </div>
      <dl className="mt-5 divide-y divide-zinc-800">
        <DetailRow label="Application version" value={data.version} />
        <DetailRow
          label="Latest database backup"
          value={
            data.backup
              ? formatDate(data.backup.createdAt)
              : "No backup recorded"
          }
        />
        <DetailRow
          label="Backup size"
          value={formatBytes(data.backup?.sizeBytes)}
        />
        <DetailRow
          label="Database records"
          value={
            data.backup ? data.backup.records.toLocaleString("en-US") : "—"
          }
        />
        <DetailRow
          label="Checked at"
          value={formatDate(data.checkedAt)}
          icon={Activity}
        />
      </dl>
    </section>
  );
}

function AlertsSection({ alerts }: Readonly<{ alerts: SystemAlert[] }>) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-white">Active alerts</h2>
        </div>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          No active alerts.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminSystemPage() {
  const { data, error, isLoading, mutate } = useSWR<SystemOverview>(
    "/api/admin/system",
    fetcher,
    { refreshInterval: 15_000 },
  );
  const status = statusPresentation(data?.status ?? "warning");
  const StatusIcon = status.icon;

  return (
    <div>
      <AdminPageHeader
        title="System Overview"
        description="Live host, container, database, storage, and backup health for this deployment."
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
              Refresh
            </button>
          </>
        }
      />

      {isLoading && (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="System metrics are loading"
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
          {error.message || "The system overview could not be loaded."}
        </div>
      )}

      {data && (
        <>
          <MetricsSection data={data} />
          <StorageSection data={data} />
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <RuntimeSection data={data} />
            <RecoverySection data={data} />
          </div>
          <AlertsSection alerts={data.alerts} />
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
