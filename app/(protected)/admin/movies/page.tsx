"use client";
import React, { useEffect, useState } from "react";
import MovieAdminTable from "@/components/admin/MovieAdminTable";

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/movies/admin?page=${page}&pageSize=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.movies) {
          setMovies(data.movies);
          setTotalPages(data.totalPages);
        } else {
          setError("Fehler beim Laden der Filme.");
        }
      })
      .catch(() => setError("Fehler beim Laden der Filme."))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <MovieAdminTable
          items={movies}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
