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
        if (data?.movies) {
          setMovies(data.movies);
          setTotalPages(data.totalPages);
        } else {
          setError("Fehler beim Laden der Filme.");
        }
      })
      .catch(() => setError("Fehler beim Laden der Filme."))
      .finally(() => setLoading(false));
  }, [page]);

  const renderContent = () => {
    if (loading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div className="text-red-500">{error}</div>;
    }
    return (
      <MovieAdminTable
        items={movies}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    );
  };

  return <div>{renderContent()}</div>;
}
