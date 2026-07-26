import type { LucideIcon } from "lucide-react";

export function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "red",
}: Readonly<{
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "red" | "green" | "blue" | "amber" | "violet";
}>) {
  const tones = {
    red: "bg-red-500/10 text-red-400 ring-red-500/20",
    green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    blue: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
          {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
