import { z } from 'zod';
import { CATEGORY_COLOR_PATTERN } from './category-color';

const categoryName = z.string()
  .transform((name) => name.normalize('NFKC').trim().replaceAll(/\s+/g, ' '))
  .pipe(z.string().min(1).max(80));

export const CategoryCreateSchema = z.object({
  name: categoryName, nameEn: categoryName,
  color: z.string().regex(CATEGORY_COLOR_PATTERN).transform(color => color.toUpperCase()).optional(),
}).strict();
export const CategoryUpdateSchema = CategoryCreateSchema.extend({ id: z.string().min(1).max(191) });

export type CategorySummary = { id: string; name: string; nameEn?: string; color?: string | null; contentCount: number };
