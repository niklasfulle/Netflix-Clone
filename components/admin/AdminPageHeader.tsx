import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: Readonly<{ title: string; description: string; actions?: ReactNode }>) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">Netflix Administration</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
