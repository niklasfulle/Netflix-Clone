"use client";

import { CircleCheck, History, UsersRound } from 'lucide-react';

import { useLanguage } from '@/components/providers/LanguageProvider';

const benefits = [
  { icon: UsersRound, label: 'Personal profiles' as const },
  { icon: History, label: 'Continue where you stopped' as const },
  { icon: CircleCheck, label: 'Your media stays yours' as const },
];

export const AuthShowcase = () => {
  const { t } = useLanguage();

  return (
    <div className="hidden max-w-2xl lg:block">
      <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
        {t('Your private streaming space')}
      </p>
      <h1 className="max-w-xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white xl:text-6xl">
        {t('Your library. Your profiles. Your night.')}
      </h1>
      <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-zinc-300">
        {t('Sign in to continue watching, manage profiles, and explore your personal media library.')}
      </p>
      <ul className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
        {benefits.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm font-medium text-zinc-200 backdrop-blur-sm"
          >
            <Icon className="h-5 w-5 text-red-400" aria-hidden="true" />
            <span className="mt-5 text-pretty">{t(label)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
