import React from "react";
import EditMovieButton from "../EditMovieButton";

interface MovieAdminTableProps {
  items: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
    views: number;
    actors?: any[];
  }>;
  page?: number;
  setPage?: (page: number) => void;
  totalPages?: number;
}


const MovieAdminTable: React.FC<MovieAdminTableProps> = ({ items, page, setPage, totalPages }) => {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string>("title");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  // Pagination now handled by parent

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getActorName = (item: any) => {
    if (!Array.isArray(item.actors) || item.actors.length === 0) return "";
    return item.actors[0]?.actor?.name || item.actors[0]?.name || "";
  };

  const getSortValue = (item: any, key: string): string | number => {
    if (key === "title" || key === "type") {
      return item[key];
    }
    if (key === "views") {
      return item.views;
    }
    if (key === "createdAt") {
      return new Date(item.createdAt).getTime();
    }
    if (key === "actors") {
      return getActorName(item);
    }
    return "";
  };

  const compareValues = (aValue: string | number, bValue: string | number, direction: "asc" | "desc") => {
    if (typeof aValue === "string" && typeof bValue === "string") {
      return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  };

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aValue = getSortValue(a, sortKey);
    const bValue = getSortValue(b, sortKey);
    return compareValues(aValue, bValue, sortDirection);
  });

  // No local pagination, use all items from parent

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Movies/Series Management</h1>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 items-stretch md:items-end">
        <input
          className="border border-zinc-700 rounded-lg px-4 py-3 bg-zinc-900 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all shadow-sm placeholder:text-zinc-400"
          placeholder="Search by title..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            if (setPage) setPage(1);
          }}
        />
      </div>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">All Movies & Series</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="py-3 px-4 rounded-l-xl text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("title")}>Title {sortKey === "title" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("actors")}>Actors {sortKey === "actors" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("type")}>Typ {sortKey === "type" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("createdAt")}>Created {sortKey === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("views")}>Views {sortKey === "views" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th className="py-3 px-4 rounded-r-xl text-zinc-300 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-zinc-400 text-center">No movies or series found.</td>
                </tr>
              ) : (
                sorted.map((item, idx) => (
                  <tr key={item.id + '-' + idx} className="bg-zinc-800/80 hover:bg-zinc-700/60 transition-all">
                    <td className="py-2 px-4 font-semibold text-zinc-100">{item.title}</td>
                    <td className="py-2 px-4 font-semibold text-zinc-200">
                      {/* Schauspieler aus item.actors */}
                      {Array.isArray(item.actors) && item.actors.length > 0
                        ? item.actors.map((a: any) => a?.actor?.name || a?.name || "").filter(Boolean).join(", ")
                        : <span className="text-zinc-500">-</span>}
                    </td>
                    <td className="py-2 px-4 font-semibold text-zinc-200">{item.type}</td>
                    <td className="py-2 px-4 font-semibold text-zinc-200">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-4 font-semibold text-zinc-200">{item.views}</td>
                    <td className="py-2 px-4">
                      <EditMovieButton movieId={item.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {typeof page === 'number' && typeof setPage === 'function' && typeof totalPages === 'number' && (
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
        )}
      </div>
    </div>
  );
};

export default MovieAdminTable;
