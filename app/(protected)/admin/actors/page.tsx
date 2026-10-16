"use client";

import Image from "next/image";
import { Edit3, ExternalLink, Eye, GitMerge, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useDialogFocus } from "@/hooks/useDialogFocus";

type ActorContent = { id: string; title: string; type: string; status: string; thumbnailUrl: string };
type ActorSource = { id: string; label: string; url: string; createdAt: string };
type Actor = {
  id: string;
  name: string;
  movieCount: number;
  seriesCount: number;
  views: number;
  content: ActorContent[];
  sources: ActorSource[];
};
type ActorDialogType = "add" | "edit" | "merge";

function getActorDialogTitle(dialog: ActorDialogType | null) {
  switch (dialog) {
    case "add":
      return "Darsteller hinzufügen";
    case "edit":
      return "Darsteller umbenennen";
    case "merge":
      return "Darsteller zusammenführen";
    default:
      return "";
  }
}

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Darsteller konnten nicht geladen werden.");
  return data;
});

export default function AdminActorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [orphaned, setOrphaned] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialog, setDialog] = useState<ActorDialogType | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [detailActor, setDetailActor] = useState<Actor | null>(null);
  const [name, setName] = useState("");
  const [targetId, setTargetId] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [isSourceFormOpen, setIsSourceFormOpen] = useState(false);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const editorDialogRef = useRef<HTMLDialogElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const editorTriggerRef = useRef<HTMLElement | null>(null);
  const closeDetails = useCallback(() => setDetailActor(null), []);
  const closeEditor = useCallback(() => setDialog(null), []);

  useDialogFocus(Boolean(detailActor), detailDialogRef, closeDetails, undefined, detailTriggerRef);
  useDialogFocus(Boolean(dialog), editorDialogRef, closeEditor, undefined, editorTriggerRef);

  useEffect(() => {
    const timeout = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo(() => new URLSearchParams({
    page: String(page), pageSize: String(pageSize), search, sort, direction, orphaned: String(orphaned),
  }).toString(), [page, pageSize, search, sort, direction, orphaned]);
  const { data, error, isLoading, mutate } = useSWR(`/api/actors?${params}`, fetcher, { keepPreviousData: true });

  const openDialog = (type: ActorDialogType, actor?: Actor) => {
    editorTriggerRef.current = document.activeElement as HTMLElement | null;
    setDialog(type);
    setSelectedActor(actor || null);
    setName(actor?.name || "");
    setTargetId("");
    setErrorMessage("");
  };

  const openDetails = (actor: Actor) => {
    detailTriggerRef.current = document.activeElement as HTMLElement | null;
    setIsSourceFormOpen(false);
    setSourceLabel("");
    setSourceUrl("");
    setSourceError("");
    setDetailActor(actor);
  };

  const submitActor = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/actors", {
      method: dialog === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dialog === "edit" ? { id: selectedActor?.id, name } : { name }),
    });
    const result = await response.json();
    if (!response.ok) return setErrorMessage(result.error);
    setDialog(null);
    setMessage(dialog === "edit" ? "Darsteller wurde umbenannt." : "Darsteller wurde hinzugefügt.");
    await mutate();
  };

  const mergeActor = async () => {
    const response = await fetch("/api/actors/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: selectedActor?.id, targetId }),
    });
    const result = await response.json();
    if (!response.ok) return setErrorMessage(result.error);
    setDialog(null);
    setDetailActor(null);
    setMessage("Darsteller und Zuordnungen wurden zusammengeführt.");
    await mutate();
  };

  const deleteActor = async (actor: Actor) => {
    if (!globalThis.confirm(`„${actor.name}“ wirklich löschen?`)) return;
    const response = await fetch(`/api/actors?id=${actor.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return setErrorMessage(result.error);
    setDetailActor(null);
    setMessage("Darsteller wurde gelöscht.");
    await mutate();
  };

  const addActorSource = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailActor) return;
    setSourceError("");
    setIsSavingSource(true);
    try {
      const response = await fetch(`/api/actors/${detailActor.id}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: sourceLabel, url: sourceUrl }),
      });
      const result = await response.json();
      if (!response.ok) {
        setSourceError(result.error || "Quelle konnte nicht gespeichert werden.");
        return;
      }
      setDetailActor((current) => current ? { ...current, sources: [result.source, ...(current.sources || [])] } : current);
      setSourceLabel("");
      setSourceUrl("");
      setIsSourceFormOpen(false);
      setMessage("Quelle wurde hinzugefügt.");
      await mutate();
    } catch {
      setSourceError("Quelle konnte nicht gespeichert werden.");
    } finally {
      setIsSavingSource(false);
    }
  };

  const deleteActorSource = async (source: ActorSource) => {
    if (!detailActor) return;
    const response = await fetch(`/api/actors/${detailActor.id}/sources?sourceId=${encodeURIComponent(source.id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setSourceError(result.error || "Quelle konnte nicht entfernt werden.");
      return;
    }
    setDetailActor((current) => current ? { ...current, sources: (current.sources || []).filter((item) => item.id !== source.id) } : current);
    setMessage("Quelle wurde entfernt.");
    await mutate();
  };

  const dialogTitle = getActorDialogTitle(dialog);

  return (
    <div>
      <AdminPageHeader
        title="Darsteller"
        description="Personen katalogweit verwalten, Zuordnungen prüfen und doppelte Einträge sicher zusammenführen."
        actions={
          <button type="button" onClick={() => openDialog("add")} title="Neuen Darsteller anlegen" className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500">
            <Plus className="h-4 w-4" /> Darsteller hinzufügen
          </button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <span className="sr-only">Darsteller suchen</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Darsteller suchen …" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500" />
          </label>
          <select aria-label="Darsteller sortieren" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="admin-select h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
            <option value="name">Nach Name</option><option value="views">Nach Views</option><option value="movieCount">Nach Filmen</option><option value="seriesCount">Nach Serien</option>
          </select>
          <select aria-label="Sortierreihenfolge" value={direction} onChange={(event) => setDirection(event.target.value as "asc" | "desc")} className="admin-select h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
            <option value="asc">Aufsteigend</option><option value="desc">Absteigend</option>
          </select>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300">
            <input type="checkbox" checked={orphaned} onChange={(event) => { setOrphaned(event.target.checked); setPage(1); }} className="accent-red-600" />
            <span>Ohne Inhalte</span>
          </label>
        </div>
        {message && <output className="block border-b border-zinc-800 px-4 py-3 text-sm text-emerald-400">{message}</output>}
        {(error || errorMessage) && <p role="alert" className="border-b border-zinc-800 px-4 py-3 text-sm text-red-400">{error?.message || errorMessage}</p>}
        {isLoading && <div className="h-72 animate-pulse bg-zinc-900" aria-label="Darsteller werden geladen" />}
        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500">
                  <tr><th className="px-5 py-3">Name</th><th className="px-3 py-3">Filme</th><th className="px-3 py-3">Serien</th><th className="px-3 py-3">Views</th><th className="px-5 py-3 text-right">Aktionen</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.actors.length === 0 && <tr><td colSpan={5} className="p-14 text-center text-zinc-500">Keine Darsteller gefunden.</td></tr>}
                  {data.actors.map((actor: Actor) => (
                    <tr key={actor.id} className="hover:bg-zinc-800/50">
                      <td className="px-5 py-4 font-semibold text-white">{actor.name}</td>
                      <td className="px-3 py-4 text-zinc-300">{actor.movieCount}</td>
                      <td className="px-3 py-4 text-zinc-300">{actor.seriesCount}</td>
                      <td className="px-3 py-4 text-zinc-300">{actor.views.toLocaleString("de-DE")}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openDetails(actor)} aria-label={`${actor.name} anzeigen`} title={`${actor.name} anzeigen`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white"><Eye className="h-4 w-4" /></button>
                          <button type="button" onClick={() => openDialog("edit", actor)} aria-label={`${actor.name} umbenennen`} title={`${actor.name} umbenennen`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                          <button type="button" onClick={() => openDialog("merge", actor)} aria-label={`${actor.name} zusammenführen`} title={`${actor.name} mit einem anderen Eintrag zusammenführen`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white"><GitMerge className="h-4 w-4" /></button>
                          <button type="button" onClick={() => deleteActor(actor)} disabled={actor.movieCount + actor.seriesCount > 0} aria-label={`${actor.name} löschen`} title={actor.movieCount + actor.seriesCount > 0 ? "Darsteller mit zugeordneten Inhalten können nicht gelöscht werden" : `${actor.name} löschen`} className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-25"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination page={page} totalPages={data.totalPages} total={data.total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </>
        )}
      </section>

      {detailActor && (
        <dialog
          ref={detailDialogRef}
          open
          aria-modal="true"
          aria-label={`Details zu ${detailActor.name}`}
          className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center overflow-hidden border-0 bg-black/75 p-3 text-inherit backdrop-blur-sm sm:p-6"
        >
          <button
            type="button"
            aria-label="Hintergrund schließen"
            onClick={() => setDetailActor(null)}
            className="absolute inset-0 border-0 bg-transparent p-0"
          />
          <div className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:max-h-[min(85dvh,52rem)]">
            <header className="shrink-0 border-b border-zinc-800 bg-zinc-900/60 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-widest text-red-400">Darstellerübersicht</p><h2 className="mt-1.5 break-words text-xl font-bold text-white sm:text-2xl">{detailActor.name}</h2></div>
                <button type="button" onClick={() => setDetailActor(null)} aria-label="Details schließen" title="Darstellerdetails schließen" className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><X className="h-5 w-5" /></button>
              </div>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {[["Filme", detailActor.movieCount], ["Serien", detailActor.seriesCount], ["Views", detailActor.views]].map(([label, value]) => (
                  <div key={String(label)} className="flex items-baseline gap-2"><dt className="order-2 text-zinc-400">{label}</dt><dd className="order-1 font-semibold tabular-nums text-white">{Number(value).toLocaleString("de-DE")}</dd></div>
                ))}
              </dl>
            </header>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:#52525b_transparent] [scrollbar-width:thin] sm:px-6">
              <section aria-labelledby="actor-sources-heading">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id="actor-sources-heading" className="font-semibold text-white">Quellen für neue Inhalte</h3>
                  <button type="button" aria-expanded={isSourceFormOpen} aria-controls="actor-source-form" onClick={() => setIsSourceFormOpen((current) => !current)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Plus className="h-3.5 w-3.5" />{isSourceFormOpen ? "Formular schließen" : "Quelle hinzufügen"}</button>
                </div>
                <p className="mt-2 text-sm text-zinc-400">Externe Seiten zum Nachschlagen neuer Film- und Serienauftritte.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(detailActor.sources || []).length === 0 && <p className="text-sm text-zinc-500 sm:col-span-2">Noch keine Quellen hinterlegt.</p>}
                  {(detailActor.sources || []).map((source) => (
                    <div key={source.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" title={`${source.label} in neuem Tab öffnen`} className="flex min-w-0 items-center gap-2 rounded text-sm font-medium text-red-300 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">{source.label}</span></a>
                      <button type="button" onClick={() => deleteActorSource(source)} aria-label={`${source.label} entfernen`} title={`${source.label} entfernen`} className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                {isSourceFormOpen && (
                  <form id="actor-source-form" onSubmit={addActorSource} className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-2">
                    <label className="min-w-0 text-sm text-zinc-300">Bezeichnung<input required maxLength={80} value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="z. B. IMDb-Profil" className="mt-1.5 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500" /></label>
                    <label className="min-w-0 text-sm text-zinc-300">URL<input required type="url" maxLength={2048} value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" className="mt-1.5 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500" /></label>
                    <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2">
                      <button type="button" onClick={() => setIsSourceFormOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white">Abbrechen</button>
                      <button type="submit" disabled={isSavingSource || !sourceLabel.trim() || !sourceUrl.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40">{isSavingSource ? "Wird gespeichert …" : "Quelle speichern"}</button>
                    </div>
                  </form>
                )}
                {sourceError && <p role="alert" className="mt-3 text-sm text-red-400">{sourceError}</p>}
              </section>
              <section aria-labelledby="actor-content-heading" className="mt-6 border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between gap-3"><h3 id="actor-content-heading" className="font-semibold text-white">Zugeordnete Inhalte</h3><span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs tabular-nums text-zinc-400">{detailActor.content.length}</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {detailActor.content.length === 0 && <p className="py-3 text-sm text-zinc-500 sm:col-span-2">Keine Inhalte zugeordnet.</p>}
                  {detailActor.content.map((item) => (
                    <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-2.5">
                      <Image src={item.thumbnailUrl} alt="" width={64} height={40} className="h-10 w-16 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0"><p className="line-clamp-2 break-words text-sm font-medium text-white">{item.title}</p><p className="mt-1 text-xs text-zinc-400">{item.type === "Serie" ? "Serie" : "Film"} · {({ PUBLISHED: "Veröffentlicht", DRAFT: "Entwurf", ARCHIVED: "Archiviert" } as Record<string, string>)[item.status] || item.status}</p></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </dialog>
      )}

      {dialog && (
        <dialog ref={editorDialogRef} open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label={dialogTitle}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">{dialogTitle}</h2><button type="button" onClick={() => setDialog(null)} aria-label="Dialog schließen" title="Dialog schließen" className="p-2 text-zinc-500"><X className="h-5 w-5" /></button></div>
            {dialog === "merge" ? (
              <div className="mt-5">
                <p className="text-sm text-zinc-400">Alle Zuordnungen von <strong className="text-white">{selectedActor?.name}</strong> werden auf den gewählten Darsteller übertragen. Der Quell-Eintrag wird danach gelöscht.</p>
                <select aria-label="Zieldarsteller auswählen" value={targetId} onChange={(event) => setTargetId(event.target.value)} className="admin-select mt-4 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white">
                  <option value="">Ziel auswählen …</option>
                  {data?.actors.filter((actor: Actor) => actor.id !== selectedActor?.id).map((actor: Actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
                </select>
                <button type="button" onClick={mergeActor} disabled={!targetId} title="Darsteller und zugeordnete Inhalte zusammenführen" className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Zusammenführen</button>
              </div>
            ) : (
              <form onSubmit={submitActor} className="mt-5">
                <label className="text-sm font-medium text-zinc-300">Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white outline-none focus:border-red-500" /></label>
                <button type="submit" disabled={!name.trim()} title={dialog === "edit" ? "Neuen Darstellernamen speichern" : "Darsteller mit diesem Namen anlegen"} className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{dialog === "edit" ? "Änderung speichern" : "Darsteller anlegen"}</button>
              </form>
            )}
            {errorMessage && <p className="mt-3 text-sm text-red-400" role="alert">{errorMessage}</p>}
          </div>
        </dialog>
      )}
    </div>
  );
}
