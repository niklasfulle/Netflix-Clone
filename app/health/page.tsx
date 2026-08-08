import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const health = await getHealthStatus();
  const isHealthy = health.status === "ok";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
              Netflix Clone
            </p>
            <h1 className="mt-2 text-3xl font-semibold">System Health</h1>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isHealthy
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {isHealthy ? "All systems operational" : "Issue detected"}
          </span>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <StatusCard label="Application" value={health.checks.application} />
          <StatusCard label="Database" value={health.checks.database} />
          <StatusCard label="Media storage" value={health.checks.storage} />
          <InfoCard label="Version" value={health.version} />
          <InfoCard
            label="Last checked"
            value={new Date(health.timestamp).toLocaleString("en-US")}
          />
        </dl>
      </section>
    </main>
  );
}

function StatusCard({
  label,
  value,
}: Readonly<{ label: string; value: "ok" | "error" }>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd
        className={`mt-2 text-lg font-medium ${
          value === "ok" ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {value === "ok" ? "Operational" : "Unavailable"}
      </dd>
    </div>
  );
}

function InfoCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="mt-2 text-lg font-medium text-zinc-100">{value}</dd>
    </div>
  );
}
