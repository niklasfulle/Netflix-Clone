import React from "react";
import EditMovieButton from "../EditMovieButton";

interface MovieAdminTableProps {
  items: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
    views: number;
  }>;
}

const MovieAdminTable: React.FC<MovieAdminTableProps> = ({ items }) => {
  const [search, setSearch] = React.useState("");
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Movies/Series Management</h1>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 items-stretch md:items-end">
        <input
          className="border border-zinc-700 rounded-lg px-4 py-3 bg-zinc-900 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all shadow-sm placeholder:text-zinc-400"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">All Movies & Series</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="py-3 px-4 rounded-l-xl text-zinc-300 font-bold">Title</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Typ</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Created</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Views</th>
                <th className="py-3 px-4 rounded-r-xl text-zinc-300 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-4 text-zinc-400 text-center">No movies or series found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="bg-zinc-800/80 hover:bg-zinc-700/60 transition-all">
                    <td className="py-2 px-4 font-semibold text-zinc-100">{item.title}</td>
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
      </div>
    </div>
  );
};

export default MovieAdminTable;
