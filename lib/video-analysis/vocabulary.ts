import { normalizedCategoryName, VideoAnalysisError } from './contracts';

export type AnalysisCategory = { name: string; nameEn?: string };
export type CategoryVocabulary = readonly (string | AnalysisCategory)[];
export const MAX_ANALYSIS_CATEGORIES = 1024;
export function prepareVocabulary(categories: CategoryVocabulary): AnalysisCategory[] {
  const unique = new Map<string, AnalysisCategory>();
  for (const category of categories) {
    const value = typeof category === 'string' ? { name: category, nameEn: category } : category;
    const name = value.name.normalize('NFKC').trim().replace(/\s+/g, ' ');
    const nameEn = value.nameEn?.normalize('NFKC').trim().replace(/\s+/g, ' ') || name;
    if (!name || name.length > 80 || nameEn.length > 80) throw new VideoAnalysisError('INVALID_CATEGORY_VOCABULARY', true);
    unique.set(normalizedCategoryName(name), { name, nameEn });
  }
  if (unique.size > MAX_ANALYSIS_CATEGORIES) throw new VideoAnalysisError('TOO_MANY_ANALYSIS_CATEGORIES', true);
  return [...unique.values()];
}
export function vocabularyBatches(categories: AnalysisCategory[]) {
  const batches: AnalysisCategory[][] = [];
  let batch: AnalysisCategory[] = [];
  for (const category of categories) {
    if (batch.length && (batch.length >= 32 || JSON.stringify([...batch, category]).length > 4096)) { batches.push(batch); batch = []; }
    batch.push(category);
  }
  if (batch.length) batches.push(batch);
  return batches;
}
