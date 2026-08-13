"use client";

import Link from 'next/link';

interface BackButtonProps {
  label: string;
  href: string;
}

export const BackButton = ({ label, href }: BackButtonProps) => {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {label}
    </Link>
  );
};
