"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  timestamp?: string;
  action?: string;
  [key: string]: any;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs.reverse());
        else setError("No logs found.");
      })
      .catch(() => setError("Fehler beim Laden der Logs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Logs Management</h1>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 border mb-8 min-h-[300px]">
        {loading && <div className="text-gray-400">Lade Logs...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && logs.length === 0 && (
          <div className="text-gray-400">Keine Logs gefunden.</div>
        )}
        {!loading && !error && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-zinc-400">
                  <th className="px-2 py-1">Zeit</th>
                  <th className="px-2 py-1">Aktion</th>
                  <th className="px-2 py-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b border-zinc-700 hover:bg-zinc-700/30">
                    <td className="px-2 py-1 font-mono whitespace-nowrap">{log.timestamp || "-"}</td>
                    <td className="px-2 py-1">{log.action || "-"}</td>
                    <td className="px-2 py-1 max-w-[400px] overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all text-zinc-300">{JSON.stringify(log, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
