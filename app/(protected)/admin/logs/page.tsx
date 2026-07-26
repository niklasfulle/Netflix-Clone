"use client";

import { Check, Clipboard, Download, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";

type LogEntry = {
  timestamp?: string;
  action?: string;
  userId?: string;
  level?: string;
  [key: string]: unknown;
};

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Logs konnten nicht geladen werden.");
  return data;
});

const levelStyles: Record<string, string> = {
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  warn: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  warning: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  error: "bg-red-500/10 text-red-300 ring-red-500/20",
};

export default function AdminLogsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [detail, setDetail] = useState<LogEntry | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo(() => new URLSearchParams({
    page: String(page), pageSize: String(pageSize), search, level, action, userId, from, to,
  }).toString(), [page, pageSize, search, level, action, userId, from, to]);
  const { data, error, isLoading, mutate, isValidating } = useSWR(`/api/logs?${params}`, fetcher, { refreshInterval: autoRefresh ? 10_000 : 0, keepPreviousData: true });

  const clearLogs = async () => {
    const response = await fetch("/api/logs/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error);
    setClearOpen(false); setConfirmation(""); setMessage("System-Logs wurden geleert."); setPage(1); await mutate();
  };

  const copyDetails = async () => {
    if (!detail) return;
    await navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setLevel("all"); setAction(""); setUserId(""); setFrom(""); setTo(""); setPage(1);
  };

  return (
    <div>
      <AdminPageHeader
        title="System-Logs"
        description="Backend-Aktivitäten durchsuchen, Fehler analysieren und Protokolle kontrolliert exportieren oder leeren."
        actions={
          <>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} className="accent-red-600" /> Auto-Refresh
            </label>
            <a href={`/api/logs?${params}&format=csv`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-800"><Download className="h-4 w-4" /> CSV</a>
            <button type="button" onClick={() => setClearOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"><Trash2 className="h-4 w-4" /> Logs leeren</button>
          </>
        }
      />

      {data?.counts && (
        <div className="mb-5 flex flex-wrap gap-2">
          {["info", "warn", "error"].map((item) => <button key={item} type="button" onClick={() => { setLevel(item); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${levelStyles[item]}`}>{item === "warn" ? "WARN" : item.toUpperCase()} · {data.counts[item] || 0}</button>)}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="grid gap-3 border-b border-zinc-800 p-4 xl:grid-cols-[minmax(240px,1fr)_150px_180px_180px_160px_160px]">
          <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><span className="sr-only">Logs durchsuchen</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Volltextsuche …" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500" /></label>
          <select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="all">Alle Level</option><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option></select>
          <input value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="Aktion …" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white" />
          <input value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }} placeholder="Benutzer-ID …" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white" />
          <input type="date" aria-label="Von Datum" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300" />
          <input type="date" aria-label="Bis Datum" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300" />
        </div>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <button type="button" onClick={resetFilters} className="text-xs text-zinc-500 hover:text-white">Filter zurücksetzen</button>
          <span className="flex items-center gap-2 text-xs text-zinc-600"><RefreshCw className={`h-3 w-3 ${isValidating ? "animate-spin" : ""}`} /> {autoRefresh ? "Aktualisierung alle 10 Sekunden" : "Manuelle Aktualisierung"}</span>
        </div>
        {message && <output className={`block border-b border-zinc-800 px-4 py-3 text-sm ${message.includes("wurden") ? "text-emerald-400" : "text-red-400"}`}>{message}</output>}
        {error && <p role="alert" className="p-5 text-red-400">{error.message}</p>}
        {isLoading && <div className="h-80 animate-pulse bg-zinc-900" aria-label="Logs werden geladen" />}
        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-3">Zeit</th><th className="px-3 py-3">Level</th><th className="px-3 py-3">Aktion</th><th className="px-3 py-3">Benutzer-ID</th><th className="px-5 py-3 text-right">Details</th></tr></thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.logs.length === 0 && <tr><td colSpan={5} className="p-14 text-center text-zinc-500">Keine Logs für diese Filter gefunden.</td></tr>}
                  {data.logs.map((log: LogEntry, index: number) => (
                    <tr key={`${log.timestamp}-${index}`} className="hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">{log.timestamp ? new Date(log.timestamp).toLocaleString("de-DE") : "–"}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${levelStyles[log.level || ""] || "bg-zinc-800 text-zinc-300 ring-zinc-700"}`}>{log.level === "warning" ? "WARN" : (log.level || "UNKNOWN").toUpperCase()}</span></td>
                      <td className="px-3 py-3 font-medium text-zinc-200">{log.action || "–"}</td>
                      <td className="max-w-[220px] truncate px-3 py-3 font-mono text-xs text-zinc-500">{log.userId || "–"}</td>
                      <td className="px-5 py-3 text-right"><button type="button" onClick={() => setDetail(log)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">Anzeigen</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination page={page} totalPages={data.totalPages} total={data.total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </>
        )}
      </section>

      {detail && (
        <dialog open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label="Log-Details">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-red-400">Log-Eintrag</p><h2 className="mt-2 text-xl font-bold text-white">{detail.action || "Details"}</h2></div><button type="button" onClick={() => setDetail(null)} aria-label="Details schließen" className="p-2 text-zinc-500"><X className="h-5 w-5" /></button></div>
            <pre className="mt-5 max-h-[55vh] overflow-auto rounded-xl border border-zinc-800 bg-black p-4 text-xs leading-6 text-zinc-300">{JSON.stringify(detail, null, 2)}</pre>
            <button type="button" onClick={copyDetails} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}{copied ? "Kopiert" : "JSON kopieren"}</button>
          </div>
        </dialog>
      )}

      {clearOpen && (
        <dialog open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label="Logs endgültig leeren">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold text-white">Logs endgültig leeren?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden. Es wird ausschließlich die Backend-Logdatei geleert.</p>
            <label className="mt-5 block text-sm text-zinc-300">Gib <strong className="text-white">LOGS LÖSCHEN</strong> ein<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white outline-none focus:border-red-500" /></label>
            <div className="mt-5 flex gap-3"><button type="button" onClick={() => setClearOpen(false)} className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-200">Abbrechen</button><button type="button" onClick={clearLogs} disabled={confirmation !== "LOGS LÖSCHEN"} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Endgültig leeren</button></div>
          </div>
        </dialog>
      )}
    </div>
  );
}
