import {
  CheckCircle2,
  History,
  Layers3,
  Rocket,
  Sparkles,
} from 'lucide-react';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getChangelog, type ChangelogEntry } from '@/lib/changelog';

function ReleaseChanges({ entry }: Readonly<{ entry: ChangelogEntry }>) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {entry.changes.map((change, index) => (
        <li
          key={`${entry.version}-${index}`}
          className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-1 h-4 w-4 shrink-0 text-red-400"
          />
          <span className="min-w-0 break-words">{change}</span>
        </li>
      ))}
    </ul>
  );
}

function LatestRelease({ entry }: Readonly<{ entry: ChangelogEntry }>) {
  return (
    <section
      aria-labelledby={`release-${entry.version}`}
      className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.14] via-zinc-950 to-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/15 blur-3xl"
      />
      <div className="relative grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
        <header>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Latest Release
          </div>
          <p className="text-sm font-medium text-zinc-400">Now Available</p>
          <h2
            id={`release-${entry.version}`}
            className="mt-2 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            Version {entry.version}
          </h2>
          <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-zinc-400">
            The newest improvements, fixes, and features available in Netflix Clone.
          </p>
        </header>

        <ReleaseChanges entry={entry} />
      </div>
    </section>
  );
}

function ReleaseTimeline({ entries }: Readonly<{ entries: ChangelogEntry[] }>) {
  return (
    <section aria-labelledby="release-history-heading" className="mt-16 sm:mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
            Previous Releases
          </p>
          <h2
            id="release-history-heading"
            className="mt-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Release History
          </h2>
        </div>
        <History aria-hidden="true" className="hidden h-7 w-7 text-zinc-600 sm:block" />
      </div>

      <ol aria-label="Release history" className="relative space-y-6 border-l border-white/10 pl-6 sm:pl-10">
        {entries.map((entry) => (
          <li key={entry.version} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.9rem] top-7 h-3 w-3 rounded-full border-2 border-zinc-950 bg-zinc-600 ring-4 ring-zinc-950 sm:-left-[2.82rem]"
            />
            <article
              aria-labelledby={`release-${entry.version}`}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-lg shadow-black/10 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.055] motion-reduce:transition-none sm:p-7"
            >
              <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3
                  id={`release-${entry.version}`}
                  className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  Version {entry.version}
                </h3>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium tabular-nums text-zinc-400">
                  {entry.changes.length} {entry.changes.length === 1 ? 'Change' : 'Changes'}
                </span>
              </header>
              <ReleaseChanges entry={entry} />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ChangelogPage() {
  const changelog = getChangelog();
  const latestRelease = changelog[0];
  const previousReleases = changelog.slice(1);
  const changeCount = changelog.reduce((total, entry) => total + entry.changes.length, 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      <Navbar />
      <main id="main-content" className="relative min-h-screen px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.13),transparent_38%),radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.06),transparent_28%)]"
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <header className="mb-10 max-w-3xl sm:mb-14">
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-400">
              <Rocket aria-hidden="true" className="h-4 w-4" />
              Product Updates
            </div>
            <h1 className="text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              What’s New in Netflix Clone
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg">
              Follow every feature, improvement, and fix as the platform evolves.
            </p>
          </header>

          {latestRelease ? (
            <>
              <dl aria-label="Changelog summary" className="mb-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    <Rocket aria-hidden="true" className="h-4 w-4" /> Latest
                  </dt>
                  <dd className="mt-2 text-2xl font-bold tabular-nums text-white">v{latestRelease.version}</dd>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    <Layers3 aria-hidden="true" className="h-4 w-4" /> Releases
                  </dt>
                  <dd className="mt-2 text-2xl font-bold tabular-nums text-white">{changelog.length}</dd>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Changes
                  </dt>
                  <dd className="mt-2 text-2xl font-bold tabular-nums text-white">{changeCount}</dd>
                </div>
              </dl>

              <LatestRelease entry={latestRelease} />
              {previousReleases.length > 0 ? <ReleaseTimeline entries={previousReleases} /> : null}
            </>
          ) : (
            <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
              <History aria-hidden="true" className="mx-auto h-9 w-9 text-zinc-600" />
              <h2 className="mt-5 text-xl font-semibold text-white">No Releases Yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Release notes will appear here as soon as the first version is published.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
