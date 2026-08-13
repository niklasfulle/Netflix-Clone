"use client";
import { signIn } from 'next-auth/react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export const Social = () => {
  const { t } = useLanguage();
  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        <span>{t('or continue with')}</span>
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
      <Button
        size={"lg"}
        className="h-12 w-full rounded-xl border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        variant={"outline_dark"}
        onClick={() => {
          onClick("google");
        }}
      >
        <FcGoogle className="mr-2 h-5 w-5" aria-hidden="true" />
        Google
      </Button>
      <Button
        size={"lg"}
        className="h-12 w-full rounded-xl border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        variant={"outline_dark"}
        onClick={() => {
          onClick("github");
        }}
      >
        <FaGithub className="mr-2 h-5 w-5" aria-hidden="true" />
        GitHub
      </Button>
      </div>
    </div>
  );
};
