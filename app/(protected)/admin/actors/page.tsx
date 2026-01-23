"use client";

import { useEffect, useState } from "react";

import useSWR from "swr";



interface Actor {
  id: string;
  name: string;
  movieCount: number;
  seriesCount: number;
  views: number;
}

interface Movie {
  // Add more fields as needed
  id: string;
  title: string;
}

interface Series {
  // Add more fields as needed
  id: string;
  title: string;
}

interface ActorsApiResponse {
  actors: Actor[];
  total: number;
  totalPages: number;
}

const fetcher = <T,>(url: string): Promise<T> => fetch(url).then(r => r.json());

export default function AdminActorsPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalActors, setTotalActors] = useState<number>(0);
  const pageSize = 20;
  const { data: moviesResponse } = useSWR<{ movies: Movie[]; total: number }>("/api/movies/all", fetcher<any>);
  const movies: Movie[] = moviesResponse?.movies || [];
  const moviesTotal: number = moviesResponse?.total ?? (Array.isArray(movies) ? movies.length : 0);

  const { data: seriesResponse } = useSWR<Series[]>("/api/series/all", fetcher<any>);
  const series: Series[] = seriesResponse || [];

  const fetchActors = async (pageNum: number = page) => {
    setLoading(true);
    const res = await fetch(`/api/actors?page=${pageNum}&pageSize=${pageSize}`);
    const data: ActorsApiResponse = await res.json();
    setActors(data.actors);
    setTotalActors(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchActors(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: string): Promise<void> => {
    setError("");
    setSuccess("");
    const res = await fetch(`/api/actors?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess("Actor deleted!");
      fetchActors(page);
    } else {
      let data = {};
      data = await res.json();
      setError((data as any).error || "Error deleting actor.");
    }
  };

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
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
      setPage(1);
      fetchActors(1);
    } else {
      setError(data.error || "Error adding actor.");
    }
  };

  let actorsContent;
  if (loading) {
    actorsContent = <div className="text-zinc-400">loading...</div>;
  } else if (actors.length === 0) {
    actorsContent = <div className="text-zinc-400">No actors available.</div>;
  } else {
    actorsContent = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="py-3 px-4 rounded-l-xl text-zinc-300 font-bold">Name</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Movies</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Series</th>
                <th className="py-3 px-4 text-zinc-300 font-bold">Views</th>
                <th className="py-3 px-4 rounded-r-xl text-zinc-300 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {actors.map(actor => (
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
    );
  }

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
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">
          All Actors {" "}
          <span className="text-base text-zinc-400 font-normal">({totalActors})</span>
          <span className="ml-4 text-base text-zinc-400 font-normal">Movies: {moviesResponse ? moviesTotal : '...'}</span>
          <span className="ml-4 text-base text-zinc-400 font-normal">Series: {Array.isArray(series) ? series.length : '...'}</span>
        </h2>
        {actorsContent}
      </div>
    </div>
  );
}
