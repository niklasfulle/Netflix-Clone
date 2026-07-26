"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clapperboard,
  Eye,
  Film,
  Plus,
  Tv,
  UserRoundSearch,
  Users,
} from "lucide-react";
import useSWR from "swr";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const fetcher = (url: string) => fetch(url).then((response) => {
  if (!response.ok) throw new Error("Dashboard konnte nicht geladen werden.");
  return response.json();
});

const quickLinks = [
  { href: "/add", label: "Inhalt hinzufügen", description: "Film oder Serie mit Video anlegen", icon: Plus },
  { href: "/admin/movies", label: "Inhalte verwalten", description: "Suchen, filtern und veröffentlichen", icon: Clapperboard },
  { href: "/admin/users", label: "Benutzer prüfen", description: "Konten, Rollen und Sperren verwalten", icon: Users },
];

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard wird geladen">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
      ))}
    </div>
  );
}

function getActivityTone(level?: string) {
  if (level === "error") return "bg-red-500";
  if (level === "warn") return "bg-amber-400";
  return "bg-emerald-400";
}

export default function AdminHomePage() {
  const { data, error, isLoading } = useSWR("/api/admin/overview", fetcher, { refreshInterval: 60_000 });
  const counts = data?.counts;

  return (
    <div>
      <AdminPageHeader
        title="Guten Überblick."
        description="Alle wichtigen Kennzahlen, aktuelle Aktivitäten und häufige Management-Aufgaben an einem Ort."
        actions={
          <Link
            href="/add"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
          >
            <Plus className="h-4 w-4" /> Neuer Inhalt
          </Link>
        }
      />

      {isLoading && <DashboardSkeleton />}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200" role="alert">
          Das Dashboard konnte nicht geladen werden. Bitte versuche es erneut.
        </div>
      )}

      {counts && (
        <>
          <section aria-label="Kennzahlen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard label="Benutzer" value={counts.users} hint={`+${counts.newUsers} in 30 Tagen`} icon={Users} tone="blue" />
            <AdminMetricCard label="Filme" value={counts.movies} hint={`${counts.newContent} neue Inhalte`} icon={Film} />
            <AdminMetricCard label="Serien" value={counts.series} hint="Gesamter Katalog" icon={Tv} tone="violet" />
            <AdminMetricCard label="Darsteller" value={counts.actors} hint="Verwaltete Personen" icon={UserRoundSearch} tone="amber" />
            <AdminMetricCard label="Gesamtaufrufe" value={counts.views.toLocaleString("de-DE")} hint="Alle Wiedergabestarts" icon={Eye} tone="green" />
            <AdminMetricCard label="Aktive Profile" value={counts.activeProfiles} hint="Aktuell ausgewählt" icon={Activity} tone="blue" />
            <AdminMetricCard label="Gesperrte Konten" value={counts.blockedUsers} hint="Benötigen ggf. Prüfung" icon={Users} tone="amber" />
            <AdminMetricCard label="Fehler (24 h)" value={counts.errors24h} hint="Aus den System-Logs" icon={AlertTriangle} tone="red" />
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-white">Top-Inhalte</h2>
                  <p className="text-xs text-zinc-500">Nach Gesamtaufrufen</p>
                </div>
                <Link href="/admin/statistics" className="text-sm font-medium text-red-400 hover:text-red-300">Analytics öffnen</Link>
              </div>
              <div className="divide-y divide-zinc-800">
                {data.topContent.length === 0 && <p className="p-6 text-sm text-zinc-500">Noch keine Aufrufe vorhanden.</p>}
                {data.topContent.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-6 text-sm font-bold text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-100">{item.title || "Gelöschter Inhalt"}</p>
                      <p className="text-xs text-zinc-500">{item.type || "–"}</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">{item.views.toLocaleString("de-DE")} Views</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold text-white">Schnellaktionen</h2>
              <div className="mt-4 space-y-3">
                {quickLinks.map(({ href, label, description, icon: Icon }) => (
                  <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700 hover:bg-zinc-900">
                    <span className="rounded-lg bg-red-500/10 p-2 text-red-400"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-100">{label}</span>
                      <span className="block truncate text-xs text-zinc-500">{description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-white">Zuletzt hinzugefügt</h2>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {data.recentContent.map((item: any) => (
                  <Link href={`/edit_movie/${item.id}`} key={item.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-800">
                    <Image src={item.thumbnailUrl} alt="" width={72} height={44} className="h-11 w-[72px] rounded-lg bg-zinc-800 object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                      <span className="text-xs text-zinc-500">{item.type} · {item.status}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-white">Letzte Systemaktivität</h2>
                <Link href="/admin/logs" className="text-sm text-red-400">Alle Logs</Link>
              </div>
              <div className="divide-y divide-zinc-800">
                {data.recentActivity.length === 0 && <p className="p-5 text-sm text-zinc-500">Keine Aktivitäten vorhanden.</p>}
                {data.recentActivity.map((entry: any, index: number) => (
                  <div key={`${entry.timestamp}-${index}`} className="flex items-center gap-3 px-5 py-3">
                    <span className={`h-2 w-2 rounded-full ${getActivityTone(entry.level)}`} />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{entry.action || "Unbekannte Aktivität"}</span>
                    <time className="text-xs text-zinc-600">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–"}
                    </time>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
