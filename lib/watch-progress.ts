export const CONTINUE_WATCHING_LIMIT = 0.6;
export const CONTINUE_WATCHING_MAX_ITEMS = 4;

export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map((part) => Number.parseInt(part, 10));

  if (
    parts.length < 1 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return 0;
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function getWatchProgress(duration: string, watchTime: number): number {
  const durationInSeconds = parseDurationToSeconds(duration);
  if (durationInSeconds <= 0 || watchTime <= 0) return 0;
  return watchTime / durationInSeconds;
}

export function belongsToContinueWatching(
  duration: string,
  watchTime: number
): boolean {
  const progress = getWatchProgress(duration, watchTime);
  return progress > 0 && progress < CONTINUE_WATCHING_LIMIT;
}

interface RecentView {
  movieId: string;
  createdAt: Date | string;
}

export function getRecentContinueWatchingIds(
  views: RecentView[],
  watchTimes: Map<string, number>,
  durations: Map<string, string>,
  limit = CONTINUE_WATCHING_MAX_ITEMS
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const newestFirst = [...views].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );

  for (const view of newestFirst) {
    if (seen.has(view.movieId)) continue;
    seen.add(view.movieId);

    const watchTime = watchTimes.get(view.movieId);
    const duration = durations.get(view.movieId);
    if (
      watchTime === undefined ||
      duration === undefined ||
      !belongsToContinueWatching(duration, watchTime)
    ) {
      continue;
    }

    result.push(view.movieId);
    if (result.length === limit) break;
  }

  return result;
}
