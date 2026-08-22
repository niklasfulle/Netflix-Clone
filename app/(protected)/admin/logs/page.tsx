"use client";

import { Check, Clipboard, Download, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useDialogFocus } from "@/hooks/useDialogFocus";

type LogEntry = {
  timestamp?: string;
  action?: string;
  category?: string;
  flow?: string;
  outcome?: string;
  reasonCode?: string;
  userId?: string;
  level?: string;
  message?: string;
  source?: string;
  [key: string]: unknown;
};

type LogSource = "application" | "authentication" | "container";

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

const sourceDetails = {
  application: {
    endpoint: "/api/logs",
    filterGrid: "xl:grid-cols-[minmax(240px,1fr)_150px_180px_180px_160px_160px]",
    thirdHeader: "Aktion",
    fourthHeader: "Benutzer-ID",
    detailWidth: "max-w-[220px]",
    canClear: true,
  },
  authentication: {
    endpoint: "/api/logs",
    filterGrid: "xl:grid-cols-[minmax(280px,1fr)_150px_200px_160px_160px]",
    thirdHeader: "Flow",
    fourthHeader: "Ergebnis",
    detailWidth: "max-w-[320px]",
    canClear: false,
  },
  container: {
    endpoint: "/api/admin/container-logs",
    filterGrid: "xl:grid-cols-[minmax(320px,1fr)_150px_160px_160px]",
    thirdHeader: "Quelle",
    fourthHeader: "Nachricht",
    detailWidth: "max-w-[560px]",
    canClear: false,
  },
} as const;

function levelLabel(level?: string) {
  if (level === "warning") return "WARN";
  return (level || "UNKNOWN").toUpperCase();
}

function filterLevelLabel(level: string) {
  return level === "warn" ? "WARN" : level.toUpperCase();
}

function messageStyle(message: string) {
  return message.includes("wurden") ? "text-emerald-400" : "text-red-400";
}

function logSourceValue(source: LogSource, log: LogEntry) {
  if (source === "container") return "netflix-clone";
  if (source === "authentication") return log.flow || log.action || "–";
  return log.action || "–";
}

function logDetailValue(source: LogSource, log: LogEntry) {
  if (source === "container") return log.message || "–";
  if (source === "authentication") {
    return [log.outcome, log.reasonCode].filter(Boolean).join(" · ") || "–";
  }
  return log.userId || "–";
}

export default function AdminLogsPage() {
  const [source, setSource] = useState<LogSource>("application");
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
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const clearDialogRef = useRef<HTMLDialogElement>(null);
  const closeDetails = useCallback(() => setDetail(null), []);
  const closeClearDialog = useCallback(() => setClearOpen(false), []);

  useDialogFocus(Boolean(detail), detailDialogRef, closeDetails);
  useDialogFocus(clearOpen, clearDialogRef, closeClearDialog);

  useEffect(() => {
    const timeout = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo(() => {
    const nextParams = new URLSearchParams({
      page: String(page), pageSize: String(pageSize), search, level, action, userId, from, to,
    });
    if (source !== "container") nextParams.set("category", source);
    return nextParams.toString();
  }, [page, pageSize, search, level, action, userId, from, to, source]);
  const sourceDetail = sourceDetails[source];
  const logEndpoint = sourceDetail.endpoint;
  const { data, error, isLoading, mutate, isValidating } = useSWR(`${logEndpoint}?${params}`, fetcher, { refreshInterval: autoRefresh ? 10_000 : 0, keepPreviousData: true });
  const visibleData = data?.source === source ? data : undefined;

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

  const selectSource = (nextSource: LogSource) => {
    setSource(nextSource); setAction(""); setUserId(""); setPage(1); setDetail(null); setClearOpen(false); setMessage("");
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
            <a href={`${logEndpoint}?${params}&format=csv`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-800"><Download className="h-4 w-4" /> CSV</a>
            {sourceDetail.canClear ? <button type="button" onClick={() => setClearOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"><Trash2 className="h-4 w-4" /> Logs leeren</button> : null}
          </>
        }
      />

      <div role="tablist" className="mb-5 inline-flex max-w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1" aria-label="Log-Quelle">
        <button role="tab" type="button" onClick={() => selectSource("application")} aria-selected={source === "application"} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${source === "application" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Anwendungs-Logs</button>
        <button role="tab" type="button" onClick={() => selectSource("authentication")} aria-selected={source === "authentication"} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${source === "authentication" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Authentifizierungs-Logs</button>
        <button role="tab" type="button" onClick={() => selectSource("container")} aria-selected={source === "container"} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${source === "container" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>Docker-Container</button>
      </div>

      {visibleData?.counts && (
        <div className="mb-5 flex flex-wrap gap-2">
          {["info", "warn", "error"].map((item) => <button key={item} type="button" onClick={() => { setLevel(item); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${levelStyles[item]}`}>{filterLevelLabel(item)} · {visibleData.counts[item] || 0}</button>)}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className={`grid gap-3 border-b border-zinc-800 p-4 ${sourceDetail.filterGrid}`}>
          <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><span className="sr-only">Logs durchsuchen</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Volltextsuche …" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500" /></label>
          <select aria-label="Nach Log-Level filtern" value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="all">Alle Level</option><option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option></select>
          {source !== "container" ? <input aria-label="Nach Aktion filtern" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="Aktion …" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white" /> : null}
          {source === "application" ? <input aria-label="Nach Benutzer-ID filtern" value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }} placeholder="Benutzer-ID …" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white" /> : null}
          <input type="date" aria-label="Von Datum" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300" />
          <input type="date" aria-label="Bis Datum" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300" />
        </div>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <button type="button" onClick={resetFilters} className="text-xs text-zinc-500 hover:text-white">Filter zurücksetzen</button>
          <span className="flex items-center gap-2 text-xs text-zinc-600"><RefreshCw className={`h-3 w-3 ${isValidating ? "animate-spin" : ""}`} /> {autoRefresh ? "Aktualisierung alle 10 Sekunden" : "Manuelle Aktualisierung"}</span>
        </div>
        {message && <output className={`block border-b border-zinc-800 px-4 py-3 text-sm ${messageStyle(message)}`}>{message}</output>}
        {source === "container" && visibleData?.available === false ? <output className="block border-b border-zinc-800 px-4 py-3 text-sm text-amber-300">Der Host-Collector hat noch keine Container-Logs bereitgestellt.</output> : null}
        {error && <p role="alert" className="p-5 text-red-400">{error.message}</p>}
        {isLoading && <div className="h-80 animate-pulse bg-zinc-900" aria-label="Logs werden geladen" />}
        {visibleData && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-3">Zeit</th><th className="px-3 py-3">Level</th><th className="px-3 py-3">{sourceDetail.thirdHeader}</th><th className="px-3 py-3">{sourceDetail.fourthHeader}</th><th className="px-5 py-3 text-right">Details</th></tr></thead>
                <tbody className="divide-y divide-zinc-800">
                  {visibleData.logs.length === 0 && <tr><td colSpan={5} className="p-14 text-center text-zinc-500">Keine Logs für diese Filter gefunden.</td></tr>}
                  {visibleData.logs.map((log: LogEntry, index: number) => (
                    <tr key={`${log.timestamp}-${index}`} className="hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">{log.timestamp ? new Date(log.timestamp).toLocaleString("de-DE") : "–"}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${levelStyles[log.level || ""] || "bg-zinc-800 text-zinc-300 ring-zinc-700"}`}>{levelLabel(log.level)}</span></td>
                      <td className="px-3 py-3 font-medium text-zinc-200">{logSourceValue(source, log)}</td>
                      <td className={`${sourceDetail.detailWidth} truncate px-3 py-3 font-mono text-xs text-zinc-500`}>{logDetailValue(source, log)}</td>
                      <td className="px-5 py-3 text-right"><button type="button" onClick={() => setDetail(log)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">Anzeigen</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination page={page} totalPages={visibleData.totalPages} total={visibleData.total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </>
        )}
      </section>

      {detail && (
        <dialog ref={detailDialogRef} open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label="Log-Details">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-red-400">Log-Eintrag</p><h2 className="mt-2 text-xl font-bold text-white">{detail.action || "Details"}</h2></div><button type="button" onClick={() => setDetail(null)} aria-label="Details schließen" className="p-2 text-zinc-500"><X className="h-5 w-5" /></button></div>
            <pre className="mt-5 max-h-[55vh] overflow-auto rounded-xl border border-zinc-800 bg-black p-4 text-xs leading-6 text-zinc-300">{JSON.stringify(detail, null, 2)}</pre>
            <button type="button" onClick={copyDetails} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}{copied ? "Kopiert" : "JSON kopieren"}</button>
          </div>
        </dialog>
      )}

      {clearOpen && (
        <dialog ref={clearDialogRef} open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label="Logs endgültig leeren">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold text-white">Logs endgültig leeren?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden. Anwendungs- und Authentifizierungs-Logs werden aus der gemeinsamen Backend-Logdatei entfernt.</p>
            <label className="mt-5 block text-sm text-zinc-300">Gib <strong className="text-white">LOGS LÖSCHEN</strong> ein<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white outline-none focus:border-red-500" /></label>
            <div className="mt-5 flex gap-3"><button type="button" onClick={() => setClearOpen(false)} className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-200">Abbrechen</button><button type="button" onClick={clearLogs} disabled={confirmation !== "LOGS LÖSCHEN"} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Endgültig leeren</button></div>
          </div>
        </dialog>
      )}
    </div>
  );
}
