"use client";

import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import MovieAdminTable, { type AdminMovie } from "@/components/admin/MovieAdminTable";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Inhalte konnten nicht geladen werden.");
  return data;
});

export default function AdminMoviesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [genre, setGenre] = useState("all");
  const [actor, setActor] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo(() => new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
    type,
    status,
    genre,
    actor,
    sort,
    direction,
  }).toString(), [page, pageSize, search, type, status, genre, actor, sort, direction]);

  const { data, error, isLoading, mutate } = useSWR(`/api/movies/admin?${params}`, fetcher, { keepPreviousData: true });

  const handleSort = (key: string) => {
    if (sort === key) setDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDirection("asc");
    }
    setPage(1);
  };

  const updateStatus = async (nextStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    const response = await fetch("/api/movies/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status: nextStatus }),
    });
    if (!response.ok) {
      setMessage("Der Status konnte nicht geändert werden.");
      return;
    }
    setMessage(`${selected.length} Inhalte wurden aktualisiert.`);
    setSelected([]);
    await mutate();
  };

  const exportCsv = () => {
    const rows = [["Titel", "Typ", "Genre", "Status", "Views"], ...(data?.movies || []).map((item: AdminMovie) => [
      item.title, item.type, item.genre, item.status, String(item.views),
    ])];
    const csv = rows.map((row: string[]) => row.map((value: string) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inhalte.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setType("all"); setStatus("all"); setGenre("all"); setActor(""); setPage(1);
  };

  return (
    <div>
      <AdminPageHeader
        title="Inhalte"
        description="Filme und Serien katalogweit suchen, prüfen, veröffentlichen und bearbeiten."
        actions={
          <>
            <button type="button" onClick={exportCsv} disabled={!data?.movies?.length} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40">
              <Download className="h-4 w-4" /> CSV
            </button>
            <Link href="/admin/movies/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500">
              <Plus className="h-4 w-4" /> New Content
            </Link>
          </>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(130px,auto))]">
            <label className="relative">
              <span className="sr-only">Inhalte suchen</span>
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Titel oder Beschreibung suchen …" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500" />
            </label>
            <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
              <option value="all">Alle Typen</option><option value="Movie">Filme</option><option value="Serie">Serien</option>
            </select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
              <option value="all">Alle Status</option><option value="PUBLISHED">Veröffentlicht</option><option value="DRAFT">Entwürfe</option><option value="ARCHIVED">Archiviert</option>
            </select>
            <select value={genre} onChange={(event) => { setGenre(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
              <option value="all">Alle Genres</option>
              {data?.filters?.genres?.map((item: string) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={actor} onChange={(event) => { setActor(event.target.value); setPage(1); }} placeholder="Darsteller …" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={resetFilters} className="text-xs font-medium text-zinc-500 hover:text-white">Filter zurücksetzen</button>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 p-2">
                <span className="px-2 text-xs text-zinc-400">{selected.length} ausgewählt</span>
                <button type="button" onClick={() => updateStatus("PUBLISHED")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Veröffentlichen</button>
                <button type="button" onClick={() => updateStatus("DRAFT")} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">Als Entwurf</button>
                <button type="button" onClick={() => updateStatus("ARCHIVED")} className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white">Archivieren</button>
              </div>
            )}
          </div>
          {message && <output className="mt-3 block text-sm text-emerald-400">{message}</output>}
        </div>

        {isLoading && <div className="h-80 animate-pulse bg-zinc-900/40" aria-label="Inhalte werden geladen" />}
        {error && <div className="p-8 text-center text-red-400" role="alert">{error.message}</div>}
        {data && (
          <>
            <MovieAdminTable items={data.movies} selected={selected} onSelectionChange={setSelected} onSort={handleSort} sort={sort} direction={direction} />
            <AdminPagination
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </>
        )}
      </section>
    </div>
  );
}
