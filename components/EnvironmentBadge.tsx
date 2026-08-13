type EnvironmentBadgeProps = Readonly<{
  environment?: string;
}>;

export default function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  if (environment !== 'staging') {
    return null;
  }

  return (
    <output
      aria-label="Staging environment"
      className="pointer-events-none fixed left-1/2 top-2 z-[100] flex -translate-x-1/2 select-none items-center gap-2 rounded-full border border-amber-300/70 bg-amber-400 px-3 py-1 text-[11px] font-black tracking-[0.2em] text-zinc-950 shadow-lg shadow-black/40"
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-zinc-950 shadow-[0_0_0_3px_rgba(24,24,27,0.18)]"
      />
      <span>STAGING</span>
    </output>
  );
}
