"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clapperboard,
  Clock3,
  Eye,
  Film,
  ImageIcon,
  TriangleAlert,
  Upload,
  Users,
} from "lucide-react";

import {
  EditMovieForm,
  type EditableMovie,
} from "@/app/(protected)/edit_movie/[movieId]/_components/edit-movie-form";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import useMovie from "@/hooks/movies/useMovie";

const workflow = [
  {
    icon: Film,
    title: "Metadaten",
    description: "Titel, Beschreibung, Typ, Genre und Laufzeit kontrollieren.",
  },
  {
    icon: Users,
    title: "Besetzung",
    description: "Darsteller ergänzen oder bestehende Zuordnungen entfernen.",
  },
  {
    icon: Upload,
    title: "Videodatei",
    description: "Das vorhandene Video behalten oder eine neue Datei hochladen.",
  },
  {
    icon: ImageIcon,
    title: "Vorschaubild",
    description: "Das aktuelle Bild verwenden, neu generieren oder ersetzen.",
  },
];

function getStatusLabel(status: EditableMovie["status"]) {
  switch (status) {
    case "DRAFT":
      return "Entwurf";
    case "ARCHIVED":
      return "Archiviert";
    default:
      return "Veröffentlicht";
  }
}

function EditMovieLoading() {
  return (
    <div className="space-y-6" aria-label="Inhalt wird geladen">
      <div className="h-28 animate-pulse rounded-2xl bg-zinc-900/70" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[680px] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50" />
        <div className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50" />
      </div>
    </div>
  );
}

function EditMovieError() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inhalt nicht verfügbar"
        description="Der ausgewählte Inhalt konnte nicht geladen werden."
        actions={
          <Link
            href="/admin/movies"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Zurück zur Inhaltsverwaltung
          </Link>
        }
      />
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-red-400" aria-hidden="true" />
        <h2 className="mt-4 font-semibold text-white">Film konnte nicht geladen werden</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Prüfe, ob der Datensatz noch existiert, und versuche es anschließend erneut.
        </p>
      </section>
    </div>
  );
}

export default function AdminEditMoviePage() {
  const movieId = useParams<{ movieId: string }>().movieId;
  const { data, error, isLoading } = useMovie(movieId);

  if (isLoading) {
    return <EditMovieLoading />;
  }

  if (error || !data) {
    return <EditMovieError />;
  }

  const movie = data as EditableMovie;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${movie.title} bearbeiten`}
        description="Metadaten, Besetzung, Video und Vorschaubild zentral in der Inhaltsverwaltung aktualisieren."
        actions={
          <>
            <Link
              href={`/watch/${movie.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Inhalt ansehen
            </Link>
            <Link
              href="/admin/movies"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zur Inhaltsverwaltung
            </Link>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/10">
          <div className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900/70 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
                <Clapperboard className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-white">Inhaltsdetails</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Passe die gewünschten Felder an und speichere die Änderungen.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-14 sm:pl-0">
              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
                {movie.type === "Serie" ? "Serie" : "Film"}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
                {movie.genre}
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-7 lg:p-8">
            <EditMovieForm movie={movie} />
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-8" aria-label="Bearbeitungshinweise">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">Bearbeitungsablauf</h2>
                <p className="text-xs text-zinc-500">Vier Bereiche im Überblick</p>
              </div>
            </div>
            <ol className="space-y-5">
              {workflow.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-300">
                    {index + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <Icon className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-semibold text-white">Aktueller Datensatz</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-zinc-200">{getStatusLabel(movie.status)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">Laufzeit</dt>
                <dd className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {movie.duration}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">ID</dt>
                <dd className="max-w-40 truncate font-mono text-zinc-400" title={movie.id}>
                  {movie.id}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="text-sm font-semibold text-red-200">Löschen mit Bedacht</h2>
            <p className="mt-2 text-xs leading-5 text-red-100/60">
              Das Löschen eines Inhalts ist dauerhaft und wird vor der Ausführung noch einmal bestätigt.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
