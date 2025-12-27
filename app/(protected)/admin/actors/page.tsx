"use client";
import { useEffect, useState } from "react";

export default function AdminActorsPage() {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchActors = async () => {
    setLoading(true);
    const res = await fetch("/api/actors");
    const data = await res.json();
    setActors(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setError("");
    setSuccess("");
    const res = await fetch(`/api/actors?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess("Actor deleted!");
      fetchActors();
    } else {
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        // Keine oder ungültige JSON-Antwort
      }
      setError((data as any).error || "Error deleting actor.");
    }
  };

  useEffect(() => {
    fetchActors();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Name must not be empty.");
      return;
    }
    const res = await fetch("/api/actors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Actor added!");
      setName("");
      fetchActors();
    } else {
      setError(data.error || "Error adding actor.");
    }
  };

  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedActors = [...actors].sort((a, b) => {
    let aValue = a[sortKey];
    let bValue = b[sortKey];
    if (sortKey === "name") {
      aValue = a.name;
      bValue = b.name;
    }
    if (sortKey === "movieCount" || sortKey === "seriesCount" || sortKey === "views") {
      aValue = Number(a[sortKey]);
      bValue = Number(b[sortKey]);
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(sortedActors.length / pageSize);
  const paginatedActors = sortedActors.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Actors Management</h1>
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 items-stretch md:items-end">
        <input
          className="border border-zinc-700 rounded-lg px-4 py-3 bg-zinc-900 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all shadow-sm placeholder:text-zinc-400"
          placeholder="New Actor Name..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 rounded-md hover:bg-green-800 text-white px-6 py-3 font-bold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          Add
        </button>
      </form>
      <div className="min-h-6 mb-4">
        {error && <div className="text-red-400 animate-pulse font-medium">{error}</div>}
        {success && <div className="text-green-400 animate-pulse font-medium">{success}</div>}
      </div>
      <div className=" bg-zinc-800 rounded-2xl shadow-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">All Actors</h2>
        {loading ? (
          <div className="text-zinc-400">loading...</div>
        ) : actors.length === 0 ? (
          <div className="text-zinc-400">No actors available.</div>
        ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-1">
              <thead>
                <tr className="bg-zinc-900/80">
                  <th className="py-3 px-4 rounded-l-xl text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("name")}>Name {sortKey === "name" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("movieCount")}>Movies {sortKey === "movieCount" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("seriesCount")}>Series {sortKey === "seriesCount" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("views")}>Views {sortKey === "views" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 rounded-r-xl text-zinc-300 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActors.map(actor => (
                  <tr key={actor.id} className="bg-zinc-800/80 hover:bg-zinc-700/60 transition-all">
                    <td className="py-2 px-4 font-medium text-zinc-100">{actor.name}</td>
                    <td className="py-2 px-4 text-zinc-200">{actor.movieCount}</td>
                    <td className="py-2 px-4 text-zinc-200">{actor.seriesCount}</td>
                    <td className="py-2 px-4 text-zinc-200">{actor.views}</td>
                    <td className="py-2 px-4">
                      {actor.movieCount === 0 && actor.seriesCount === 0 && (
                        <button
                          className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-600"
                          onClick={() => handleDelete(actor.id)}
                        >Delete</button>
                      )}
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
