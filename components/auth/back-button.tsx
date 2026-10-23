"use client";

import Link from 'next/link';
import { useFormStatus } from 'react-dom';

interface BackButtonProps {
  label: string;
  href: string;
  action?: () => Promise<void>;
  pendingLabel?: string;
}

const backButtonClassName = 'inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500';

function ActionButton({ label, pendingLabel }: Readonly<Pick<BackButtonProps, 'label' | 'pendingLabel'>>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${backButtonClassName} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? pendingLabel ?? label : label}
    </button>
  );
}

export const BackButton = ({ label, href, action, pendingLabel }: BackButtonProps) => {
  if (action) {
    return (
      <form action={action} className="w-full">
        <ActionButton label={label} pendingLabel={pendingLabel} />
      </form>
    );
  }
  return (
    <Link
      href={href}
      className={backButtonClassName}
    >
      {label}
    </Link>
  );
};
