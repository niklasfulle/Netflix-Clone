"use client";


import { useEffect, useState } from "react";

type LogEntry = {
  timestamp?: string;
  action?: string;
  userId?: string;
  level?: string;
  [key: string]: any;
};


export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/logs?page=${page}&pageSize=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) {
          setLogs(data.logs);
          setTotalLogs(data.total);
          setTotalPages(data.totalPages);
        } else setError("No logs found.");
      })
      .catch(() => setError("Fehler beim Laden der Logs."))
      .finally(() => setLoading(false));
  }, [page]);

  // Filter logs by level
  const filteredLogs = levelFilter === "all"
    ? logs
    : logs.filter(log => log.level === levelFilter);

  return (
    <div className="max-w-8xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-zinc-100 tracking-tight drop-shadow-lg">Logs Management</h1>
      <div className="bg-zinc-800 rounded-3xl shadow-2xl p-8 border border-zinc-700 mb-12 min-h-[350px]">
        {loading && <div className="text-gray-400">Lade Logs...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && logs.length === 0 && (
          <div className="text-gray-400">Keine Logs gefunden.</div>
        )}
        {!loading && !error && logs.length > 0 && (
          <>
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <label className="text-zinc-300 text-sm font-medium">Level filtern:</label>
            <select
              className="bg-zinc-700 text-zinc-100 rounded px-3 py-2 outline-none border border-zinc-600"
              value={levelFilter}
              onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Alle</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <span className="text-zinc-400 text-xs">({filteredLogs.length} angezeigt)</span>
          </div>
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full text-sm text-left bg-zinc-900 rounded-2xl overflow-hidden shadow-lg">
              <thead>
                <tr className="text-zinc-300 bg-zinc-800 border-b-2 border-zinc-700 text-base">
                  <th className="px-4 py-3">Zeit</th>
                  <th className="px-4 py-3">Aktion</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={idx + (page - 1) * pageSize}
                    className="border-b border-zinc-800 hover:bg-zinc-700/60 transition-colors group"
                  >
                    <td className="px-4 py-2 font-mono whitespace-nowrap text-zinc-200 text-[15px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                      }) : "-"}
                    </td>
                    <td className="px-4 py-2 text-zinc-100 text-[15px]">{log.action || "-"}</td>
                    <td className="px-4 py-2 font-mono max-w-[180px] truncate text-zinc-400 text-[15px]">{log.userId || "-"}</td>
                    <td className={
                      "px-4 py-2 font-bold text-[15px] " +
                      (log.level === 'error' ? 'text-red-500' : log.level === 'warning' ? 'text-yellow-400' : 'text-green-400')
                    }>
                      {log.level || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="rounded-full p-2 bg-zinc-700 hover:bg-blue-600 transition-colors text-blue-300 hover:text-white shadow group-hover:scale-110"
                        title="Details anzeigen"
                        onClick={() => alert(JSON.stringify(log, null, 2))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0h-7.5m7.5 0v1.125c0 .621-.504 1.125-1.125 1.125h-5.25A1.125 1.125 0 018.25 10.125V9m7.5 0v10.125c0 .621-.504 1.125-1.125 1.125h-5.25A1.125 1.125 0 018.25 19.125V9" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded bg-zinc-700 text-zinc-300 disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              &lt;
            </button>
            <span className="text-zinc-300">Seite {page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-zinc-700 text-zinc-300 disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              &gt;
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
