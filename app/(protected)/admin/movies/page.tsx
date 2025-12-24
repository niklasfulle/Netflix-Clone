"use client";
import React from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import MovieAdminTable from "@/components/admin/MovieAdminTable";

function useAllMoviesAndSeries() {
  const { data: movies, error: moviesError } = useSWR("/api/movies/all", fetcher);
  const { data: series, error: seriesError } = useSWR("/api/series/all", fetcher);
  return {
    data: [
      ...(movies || []),
      ...(series || []),
    ],
    isLoading: !movies || !series,
    error: moviesError || seriesError,
  };
}

export default function AdminMoviesPage() {
  const { data, isLoading, error } = useAllMoviesAndSeries();

  // Views holen
  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">Error while loading</div>
      ) : (
        <MovieAdminTable items={data || []} />
      )}
    </div>
  );
}
