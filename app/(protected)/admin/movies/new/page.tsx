import type { Metadata } from "next";

import AdminCreateMovieContent from "./_components/create-movie-content";

export const metadata: Metadata = {
  title: "Netflix Admin - Neuer Inhalt",
  description: "Einen neuen Film oder eine neue Serie zum Katalog hinzufügen.",
};

export default function AdminCreateMoviePage() {
  return <AdminCreateMovieContent />;
}
