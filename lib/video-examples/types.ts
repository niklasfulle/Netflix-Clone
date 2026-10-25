export type ExampleVerdict = 'PRESENT' | 'ABSENT' | 'UNCERTAIN';
export type ExampleLabel = { categoryId: string; name: string; nameEn: string; verdict: ExampleVerdict };
export type VideoExampleDto = {
  id: string; movieId: string; startSeconds: number; endSeconds: number;
  labels: ExampleLabel[]; note: string; version: number; stale: boolean;
};
export type VideoExamplesDto = {
  movie: { id: string; title: string };
  sourceFingerprint: string; durationSeconds: number;
  examples: VideoExampleDto[];
};

export function formatExampleTime(seconds: number) {
  const milliseconds = Math.round(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 1000);
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const rest = (milliseconds % 60000) / 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${rest.toFixed(3).padStart(6, '0')}`;
}

export function parseExampleTime(value: string): number {
  const parts = value.trim().replace(',', '.').split(':');
  if (parts.length > 3 || parts.some(part => !/^\d+(?:\.\d{1,3})?$/.test(part))) return Number.NaN;
  if (parts.slice(0, -1).some(part => part.includes('.'))) return Number.NaN;
  const numbers = parts.map(Number);
  if (numbers.length > 1 && numbers[numbers.length - 1] >= 60) return Number.NaN;
  if (numbers.length === 3 && numbers[1] >= 60) return Number.NaN;
  return numbers.reduce((total, part) => total * 60 + part, 0);
}
