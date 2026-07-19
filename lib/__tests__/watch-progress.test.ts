import {
  belongsToContinueWatching,
  CONTINUE_WATCHING_MAX_ITEMS,
  getRecentContinueWatchingIds,
  getWatchProgress,
  parseDurationToSeconds,
} from '@/lib/watch-progress';

describe('watch progress', () => {
  test('limits Continue Watching to four videos', () => {
    expect(CONTINUE_WATCHING_MAX_ITEMS).toBe(4);
  });

  test.each([
    ['300', 300],
    ['05:30', 330],
    ['01:30:00', 5400],
  ])('parses %s as %i seconds', (duration, expected) => {
    expect(parseDurationToSeconds(duration)).toBe(expected);
  });

  test('returns zero for invalid durations', () => {
    expect(parseDurationToSeconds('invalid')).toBe(0);
    expect(parseDurationToSeconds('')).toBe(0);
  });

  test('calculates the watched ratio', () => {
    expect(getWatchProgress('10:00', 150)).toBe(0.25);
  });

  test('includes started videos below 60 percent', () => {
    expect(belongsToContinueWatching('10:00', 1)).toBe(true);
    expect(belongsToContinueWatching('10:00', 359)).toBe(true);
  });

  test('excludes videos at exactly 60 percent or above', () => {
    expect(belongsToContinueWatching('10:00', 360)).toBe(false);
    expect(belongsToContinueWatching('10:00', 500)).toBe(false);
  });

  test('excludes videos that have not been started', () => {
    expect(belongsToContinueWatching('10:00', 0)).toBe(false);
  });

  test('selects the four most recently viewed distinct videos below 60 percent', () => {
    const views = [
      { movieId: 'completed', createdAt: '2026-07-19T12:00:00Z' },
      { movieId: 'newest', createdAt: '2026-07-19T11:00:00Z' },
      { movieId: 'newest', createdAt: '2026-07-19T10:00:00Z' },
      { movieId: 'second', createdAt: '2026-07-19T09:00:00Z' },
      { movieId: 'third', createdAt: '2026-07-19T08:00:00Z' },
      { movieId: 'fourth', createdAt: '2026-07-19T07:00:00Z' },
      { movieId: 'fifth', createdAt: '2026-07-19T06:00:00Z' },
    ];
    const watchTimes = new Map([
      ['completed', 360],
      ['newest', 100],
      ['second', 200],
      ['third', 300],
      ['fourth', 50],
      ['fifth', 10],
    ]);
    const durations = new Map(
      [...watchTimes.keys()].map((movieId) => [movieId, '10:00'])
    );

    expect(
      getRecentContinueWatchingIds(views, watchTimes, durations)
    ).toEqual(['newest', 'second', 'third', 'fourth']);
  });

  test('sorts views by date even when the input is unordered', () => {
    const views = [
      { movieId: 'older', createdAt: '2026-07-18T10:00:00Z' },
      { movieId: 'newer', createdAt: '2026-07-19T10:00:00Z' },
    ];
    const watchTimes = new Map([
      ['older', 10],
      ['newer', 10],
    ]);
    const durations = new Map([
      ['older', '10:00'],
      ['newer', '10:00'],
    ]);

    expect(
      getRecentContinueWatchingIds(views, watchTimes, durations)
    ).toEqual(['newer', 'older']);
  });
});
