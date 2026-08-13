"use client";

import { useId } from 'react';

import { Header } from '@/components/auth/header';
import { Social } from '@/components/auth/social';

import { BackButton } from './back-button';

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  headerDescription?: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper = ({
  children,
  headerLabel,
  headerDescription,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="relative z-10 w-full max-w-[30rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
        aria-hidden="true"
      />
      <div className="px-6 pb-0 pt-8 sm:px-9 sm:pt-10">
        <Header id={titleId} label={headerLabel} description={headerDescription} />
      </div>
      <div className="px-6 py-7 sm:px-9">{children}</div>
      {showSocial && (
        <div className="border-t border-white/10 px-6 py-6 sm:px-9">
          <Social />
        </div>
      )}
      <div className="border-t border-white/10 px-6 py-4 sm:px-9">
        <BackButton href={backButtonHref} label={backButtonLabel} />
      </div>
    </section>
  );
};
