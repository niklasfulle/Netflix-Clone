import { z } from 'zod';
import { CategoryCreateSchema, type CategorySummary } from './category-validation';

export const MAX_CATEGORY_IMPORT_BYTES = 1024 * 1024;
export const CategoryImportSchema = z.object({
  schemaVersion: z.literal(1), categories: z.array(CategoryCreateSchema).min(1).max(1000),
}).strict().superRefine((document, context) => {
  const seen = new Set<string>();
  for (const category of document.categories) {
    const key = category.name.toLowerCase();
    if (seen.has(key)) context.addIssue({ code: 'custom', message: 'DUPLICATE_NAMES' });
    seen.add(key);
  }
});
export type CategoryImportDocument = z.infer<typeof CategoryImportSchema>;

export function categoryImportPreview(document: CategoryImportDocument, existing: Pick<CategorySummary, 'name' | 'nameEn'>[]) {
  const current = new Map(existing.map(category => [category.name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(), category]));
  const counts = { created: 0, updated: 0, unchanged: 0, total: document.categories.length };
  for (const category of document.categories) {
    const old = current.get(category.name.toLowerCase());
    if (!old) counts.created++;
    else if (old.name !== category.name || old.nameEn !== category.nameEn) counts.updated++;
    else counts.unchanged++;
  }
  return counts;
}
