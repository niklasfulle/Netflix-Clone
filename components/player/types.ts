export interface PlayerItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  watchTime?: number;
  captions?: ReadonlyArray<{ src: string; language: string; label: string; default?: boolean }>;
}

export function formatMediaTime(seconds: number): string {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value / 60) % 60;
  const rest = String(value % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}
