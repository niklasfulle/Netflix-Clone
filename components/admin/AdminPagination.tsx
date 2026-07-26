"use client";

export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<{
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}>) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
      <span>{total.toLocaleString("de-DE")} Einträge</span>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span className="sr-only">Einträge pro Seite</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>{size} / Seite</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          Zurück
        </button>
        <span>Seite {page} von {Math.max(totalPages, 1)}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
