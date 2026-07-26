"use client";

import { isEmpty } from "lodash";
import { ArrowLeft, Check, Settings2, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import getUser from "@/hooks/useUser";

import { SettingsForm } from "./_components/settings-form";

const SettingsSkeleton = () => (
  <div className="mx-auto grid w-full max-w-6xl animate-pulse gap-6 lg:grid-cols-[260px_1fr]">
    <div className="h-56 rounded-3xl bg-white/[0.05]" />
    <div className="space-y-6">
      <div className="h-72 rounded-3xl bg-white/[0.05]" />
      <div className="h-80 rounded-3xl bg-white/[0.05]" />
    </div>
  </div>
);

export default function SettingsPage() {
  const user = getUser();
  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useCurrentProfil();
  const router = useRouter();

  useEffect(() => {
    if (!profileLoading && (profileError || isEmpty(profile))) {
      router.replace("/profiles");
    }
  }, [profile, profileError, profileLoading, router]);

  const account = user.data?.user;
  const isLoading = user.isLoading || profileLoading || !account || !profile;

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <Navbar />

      <main className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-[radial-gradient(circle_at_15%_10%,rgba(229,9,20,0.18),transparent_38%),radial-gradient(circle_at_88%_5%,rgba(87,64,202,0.16),transparent_35%)]"
        />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Netflix
          </Link>

          <header className="mb-10 max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Account settings
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Your account, your preferences.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Manage your personal information, sign-in security, and language
              in one place.
            </p>
          </header>

          {isLoading ? (
            <SettingsSkeleton />
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="space-y-4 lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-lg font-bold shadow-lg shadow-red-950/40">
                      {(account.name || account.email || "N")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {account.name || "Netflix member"}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <nav className="mt-4 space-y-1" aria-label="Settings sections">
                    <a
                      href="#account"
                      className="flex min-h-11 items-center gap-3 rounded-xl bg-white/[0.07] px-3 text-sm font-medium text-white"
                    >
                      <UserRound className="h-4 w-4 text-red-400" aria-hidden="true" />
                      Account
                    </a>
                    <a
                      href="#security"
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Security
                    </a>
                    <a
                      href="#preferences"
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      <Settings2 className="h-4 w-4" aria-hidden="true" />
                      Preferences
                    </a>
                  </nav>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">
                        Account active
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-200/60">
                        Signed in with profile {profile.profilName || "Netflix"}.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              <SettingsForm user={user} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
