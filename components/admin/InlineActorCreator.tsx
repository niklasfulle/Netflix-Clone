"use client";

import { useId, useState } from "react";
import { LoaderCircle, Plus, UserPlus, X } from "lucide-react";

export type CreatedActor = {
  id: string;
  name: string;
};

type ActorApiResponse = Partial<CreatedActor> & {
  error?: string;
};

export function InlineActorCreator({
  onActorCreated,
}: Readonly<{ onActorCreated: (actor: CreatedActor) => void }>) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const close = () => {
    setOpen(false);
    setName("");
    setError("");
  };

  const createActor = async () => {
    const normalizedName = name.trim();
    if (!normalizedName || isCreating) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName }),
      });
      const result = await response.json() as ActorApiResponse;

      if (!response.ok) {
        setError(result.error || "Der Darsteller konnte nicht angelegt werden.");
        return;
      }

      if (typeof result.id !== "string" || typeof result.name !== "string") {
        setError("Die Antwort des Servers war unvollständig.");
        return;
      }

      onActorCreated({ id: result.id, name: result.name });
      close();
    } catch {
      setError("Der Darsteller konnte nicht angelegt werden. Bitte versuche es erneut.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 transition hover:text-red-300"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Neuen Darsteller anlegen
      </button>
    );
  }

  return (
    <section className="mt-3 rounded-xl border border-zinc-700 bg-zinc-950/70 p-4" aria-labelledby={`${inputId}-title`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-red-500/10 p-2 text-red-400">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id={`${inputId}-title`} className="text-sm font-semibold text-white">
              Darsteller hinzufügen
            </h3>
            <p className="text-xs text-zinc-500">Der neue Eintrag wird sofort ausgewählt.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={isCreating}
          aria-label="Darsteller-Eingabe schließen"
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label htmlFor={inputId} className="mt-4 block text-xs font-medium text-zinc-300">
        Name des Darstellers
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void createActor();
            }
            if (event.key === "Escape") close();
          }}
          disabled={isCreating}
          autoFocus
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
          placeholder="Vor- und Nachname"
        />
        <button
          type="button"
          onClick={() => void createActor()}
          disabled={!name.trim() || isCreating}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreating ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {isCreating ? "Wird angelegt..." : "Darsteller anlegen"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400" role="alert">{error}</p>}
    </section>
  );
}
