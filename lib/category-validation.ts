import { z } from 'zod';

const categoryName = z.string()
  .transform((name) => name.normalize('NFKC').trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(1).max(80));

export const CategoryCreateSchema = z.object({ name: categoryName, nameEn: categoryName }).strict();
export const CategoryUpdateSchema = CategoryCreateSchema.extend({ id: z.string().min(1).max(191) });

export type CategorySummary = { id: string; name: string; nameEn?: string; contentCount: number };
