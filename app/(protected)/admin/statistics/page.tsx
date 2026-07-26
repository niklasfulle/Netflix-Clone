"use client";

import dynamic from "next/dynamic";
import { Activity, Download, Eye, Film, PlayCircle, Users } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const StatsChart = dynamic(() => import("@/components/admin/StatsChart"), { ssr: false });
const StatsBarChart = dynamic(() => import("@/components/admin/StatsBarChart"), { ssr: false });
const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Statistiken konnten nicht geladen werden.");
  return data;
});

export default function AdminStatsPage() {
  const [days, setDays] = useState(30);
  const { data, error, isLoading } = useSWR(`/api/statistics/admin-overview?days=${days}`, fetcher);

  const exportCsv = () => {
    if (!data) return;
    const rows = [["Titel", "Typ", "Genre", "Views"], ...data.topContent.map((item: any) => [item.title, item.type, item.genre, String(item.views)])];
    const csv = rows.map((row) => row.map((value: string) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `analytics-${days}-tage.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Nutzung, Reichweite und Katalogentwicklung über frei wählbare Zeiträume analysieren."
        actions={
          <>
            <select aria-label="Analysezeitraum" value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
              <option value={7}>Letzte 7 Tage</option><option value={30}>Letzte 30 Tage</option><option value={90}>Letzte 90 Tage</option><option value={365}>Letztes Jahr</option>
            </select>
            <button type="button" onClick={exportCsv} disabled={!data} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"><Download className="h-4 w-4" /> Export</button>
          </>
        }
      />

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />)}</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">{error.message}</div>}
      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminMetricCard label={`Views (${days} Tage)`} value={data.periodViews.toLocaleString("de-DE")} hint={`${data.changePercent >= 0 ? "+" : ""}${data.changePercent}% zum Vorzeitraum`} icon={Eye} tone={data.changePercent >= 0 ? "green" : "red"} />
            <AdminMetricCard label="Gesamtviews" value={data.totalViews.toLocaleString("de-DE")} icon={PlayCircle} tone="red" />
            <AdminMetricCard label="Aktive Benutzer" value={data.activeUsers} hint={`von ${data.users} Konten`} icon={Users} tone="blue" />
            <AdminMetricCard label="Ø Fortschritt" value={`${data.averageProgress}%`} hint="Über gespeicherte Wiedergaben" icon={Activity} tone="violet" />
            <AdminMetricCard label="Katalog" value={data.movies + data.series} hint={`${data.movies} Filme · ${data.series} Serien`} icon={Film} tone="amber" />
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-5"><h2 className="font-semibold text-white">Views im Zeitverlauf</h2><p className="text-sm text-zinc-500">Tägliche Wiedergabestarts im gewählten Zeitraum</p></div>
            <StatsChart data={data.viewsTimeline} />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-5"><h2 className="font-semibold text-white">Neue Inhalte pro Monat</h2><p className="text-sm text-zinc-500">Katalogwachstum der letzten zwölf Monate</p></div>
              <StatsBarChart data={data.monthly} />
            </section>
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="border-b border-zinc-800 px-5 py-4"><h2 className="font-semibold text-white">Top-Inhalte</h2><p className="text-sm text-zinc-500">Im gewählten Zeitraum</p></div>
              <div className="divide-y divide-zinc-800">
                {data.topContent.length === 0 && <p className="p-6 text-sm text-zinc-500">Keine Wiedergaben vorhanden.</p>}
                {data.topContent.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3"><span className="w-5 text-xs font-bold text-zinc-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.title}</p><p className="text-xs text-zinc-500">{item.type} · {item.genre}</p></div><span className="text-sm font-semibold text-zinc-300">{item.views}</span></div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="font-semibold text-white">Views nach Genre</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.genreDistribution.map((item: any) => {
                const max = Math.max(...data.genreDistribution.map((entry: any) => entry.views), 1);
                return <div key={item.genre} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"><div className="flex justify-between text-sm"><span className="text-zinc-300">{item.genre}</span><span className="font-semibold text-white">{item.views}</span></div><div className="mt-3 h-1.5 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-red-500" style={{ width: `${(item.views / max) * 100}%` }} /></div></div>;
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
