export function getWatchProgressSaveSecond(
  currentTime: number,
  lastSavedSecond: number,
  intervalSeconds = 10,
): number | null {
  if (!Number.isFinite(currentTime) || intervalSeconds <= 0) return null;

  const currentSecond = Math.floor(currentTime);
  if (
    currentSecond <= 0 ||
    currentSecond % intervalSeconds !== 0 ||
    currentSecond === lastSavedSecond
  ) {
    return null;
  }

  return currentSecond;
}
