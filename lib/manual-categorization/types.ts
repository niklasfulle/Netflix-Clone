export type CategoryName = { id: string; name: string; nameEn?: string };
export type CategorySegment = {
  categoryId: string;
  startSeconds: number;
  endSeconds: number;
  category: CategoryName;
};
export type CategorizationMovie = {
  id: string;
  title: string;
  type: string;
  version: number;
  completed: boolean;
  categories: CategoryName[];
  segments: CategorySegment[];
};
export type CategorizationResponse = { movie: CategorizationMovie | null; remaining: number };

export function parseCategoryTime(value: string): number | null {
  if (!/^\d+(?::[0-5]\d){0,2}(?:\.\d{1,3})?$/.test(value.trim())) return null;
  const seconds = value.trim().split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
  return Number.isFinite(seconds) && seconds <= 604800 ? seconds : null;
}
export function formatCategoryTime(seconds: number): string {
  const millis = Math.round(Math.max(0, seconds) * 1000);
  const hours = Math.floor(millis / 3600000);
  const minutes = Math.floor(millis / 60000) % 60;
  const rest = Math.floor(millis / 1000) % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}.${String(millis % 1000).padStart(3, '0')}`;
}
