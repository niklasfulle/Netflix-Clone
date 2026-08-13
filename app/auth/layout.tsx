import Image from 'next/image';
import Link from 'next/link';

import { AuthShowcase } from '@/components/auth/auth-showcase';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <a
        href="#auth-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 focus:not-sr-only"
      >
        Skip to authentication
      </a>
      <section className="relative isolate min-h-dvh overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-30 object-cover object-center opacity-50"
          priority
        />
        <div className="absolute inset-0 -z-20 bg-zinc-950/55" aria-hidden="true" />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_42%,rgba(220,38,38,0.18),transparent_32%),linear-gradient(90deg,rgba(9,9,11,0.98)_0%,rgba(9,9,11,0.82)_42%,rgba(9,9,11,0.62)_100%)]"
          aria-hidden="true"
        />

        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Netflix home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
          >
            <Image
              src="/images/Logo.png"
              alt="Netflix"
              className="h-9 w-auto sm:h-11"
              width={256}
              height={78}
              priority
            />
          </Link>
          <LanguageSwitcher compact className="border-white/15 bg-black/45 backdrop-blur-md" />
        </header>

        <main
          id="auth-content"
          className="relative z-10 mx-auto grid min-h-[calc(100dvh-84px)] w-full max-w-7xl items-center gap-10 px-4 pb-10 pt-2 sm:px-6 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,30rem)] lg:gap-20 lg:px-8"
        >
          <AuthShowcase />
          <div className="flex w-full justify-center lg:justify-end">
            {children}
          </div>
        </main>
      </section>
      <Footer />
    </div>
  );
};

export default AuthLayout;
