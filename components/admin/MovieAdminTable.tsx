"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, FilePenLine } from "lucide-react";

export type AdminMovie = {
  id: string;
  title: string;
  type: string;
  genre: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  views: number;
  thumbnailUrl: string;
  videoUrl?: string;
  actors?: Array<{ actor?: { name?: string }; name?: string }>;
};

const statusStyles = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  DRAFT: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  ARCHIVED: "bg-zinc-700/60 text-zinc-300 ring-zinc-600",
};

const statusLabels = { PUBLISHED: "Veröffentlicht", DRAFT: "Entwurf", ARCHIVED: "Archiviert" };

export default function MovieAdminTable({
  items,
  selected,
  onSelectionChange,
  onSort,
  sort,
  direction,
}: Readonly<{
  items: AdminMovie[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  onSort: (key: string) => void;
  sort: string;
  direction: "asc" | "desc";
}>) {
  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(selected.filter((id) => !items.some((item) => item.id === id)));
    } else {
      onSelectionChange(Array.from(new Set([...selected, ...items.map((item) => item.id)])));
    }
  };

  const sortableHeader = (label: string, key: string) => (
    <button type="button" onClick={() => onSort(key)} className="inline-flex items-center gap-1 hover:text-white">
      {label}
      {sort === key && <span aria-label={direction === "asc" ? "aufsteigend" : "absteigend"}>{direction === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="w-12 px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Alle sichtbaren Inhalte auswählen" className="accent-red-600" />
            </th>
            <th className="px-3 py-3">{sortableHeader("Inhalt", "title")}</th>
            <th className="px-3 py-3">{sortableHeader("Typ", "type")}</th>
            <th className="px-3 py-3">{sortableHeader("Genre", "genre")}</th>
            <th className="px-3 py-3">{sortableHeader("Status", "status")}</th>
            <th className="px-3 py-3">Darsteller</th>
            <th className="px-3 py-3 text-right">Views</th>
            <th className="px-3 py-3">{sortableHeader("Aktualisiert", "updatedAt")}</th>
            <th className="w-24 px-4 py-3 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {items.length === 0 && (
            <tr><td colSpan={9} className="px-6 py-16 text-center text-zinc-500">Keine Inhalte für diese Filter gefunden.</td></tr>
          )}
          {items.map((item) => {
            const actorNames = item.actors?.map((entry) => entry.actor?.name || entry.name).filter(Boolean).join(", ") || "–";
            return (
              <tr key={item.id} className="group bg-zinc-900/30 hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => onSelectionChange(selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
                    aria-label={`${item.title} auswählen`}
                    className="accent-red-600"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Image src={item.thumbnailUrl} alt="" width={80} height={48} className="h-12 w-20 rounded-lg bg-zinc-800 object-cover" />
                    <div className="min-w-0">
                      <p className="max-w-[240px] truncate font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">ID {item.id.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-zinc-300">{item.type === "Serie" ? "Serie" : "Film"}</td>
                <td className="px-3 py-3 text-zinc-400">{item.genre}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusStyles[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </td>
                <td className="max-w-[220px] truncate px-3 py-3 text-zinc-400" title={actorNames}>{actorNames}</td>
                <td className="px-3 py-3 text-right font-medium text-zinc-200">{item.views.toLocaleString("de-DE")}</td>
                <td className="px-3 py-3 text-zinc-400">{new Date(item.updatedAt || item.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/watch/${item.id}`} aria-label={`${item.title} ansehen`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link href={`/admin/movies/${item.id}/edit`} aria-label={`${item.title} bearbeiten`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white">
                      <FilePenLine className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
