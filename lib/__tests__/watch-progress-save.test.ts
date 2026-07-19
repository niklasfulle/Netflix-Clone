import { getWatchProgressSaveSecond } from '@/lib/watch-progress-save';

describe('watch progress autosave', () => {
  test('saves once when a ten-second boundary is reached', () => {
    expect(getWatchProgressSaveSecond(10.1, -1)).toBe(10);
    expect(getWatchProgressSaveSecond(10.8, 10)).toBeNull();
  });

  test('does not save between boundaries or at the initial zero second', () => {
    expect(getWatchProgressSaveSecond(0.8, -1)).toBeNull();
    expect(getWatchProgressSaveSecond(19.9, 10)).toBeNull();
  });

  test('allows the same boundary again after the player is reset', () => {
    expect(getWatchProgressSaveSecond(20.2, -1)).toBe(20);
  });

  test('rejects invalid timestamps and intervals', () => {
    expect(getWatchProgressSaveSecond(Number.NaN, -1)).toBeNull();
    expect(getWatchProgressSaveSecond(10, -1, 0)).toBeNull();
  });
});
