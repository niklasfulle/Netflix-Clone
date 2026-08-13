import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  id?: string;
  label: string;
  description?: string;
}

export const Header = ({ id, label, description }: HeaderProps) => {
  return (
    <div className="w-full">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-lg shadow-red-950/20">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
        Netflix Access
      </p>
      <h1 id={id} className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {label}
      </h1>
      {description ? (
        <p className="mt-3 max-w-md text-pretty text-sm leading-6 text-zinc-400 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
};
