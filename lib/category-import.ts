import { db } from '@/lib/db';
import { categoryImportPreview, type CategoryImportDocument } from './category-transfer';

export async function importCategories(document: CategoryImportDocument) {
  return db.$transaction(async transaction => {
    const existing = await transaction.category.findMany({
      where: { normalizedName: { in: document.categories.map(category => category.name.toLowerCase()) } },
      select: { name: true, nameEn: true },
    });
    const result = categoryImportPreview(document, existing);
    const oldByName = new Map(existing.map(category => [category.name.toLowerCase(), category]));
    for (const category of document.categories) {
      const key = category.name.toLowerCase();
      const old = oldByName.get(key);
      if (old?.name === category.name && old.nameEn === category.nameEn) continue;
      await transaction.category.upsert({ where: { normalizedName: key }, update: category, create: { ...category, normalizedName: key } });
    }
    return result;
  }, { timeout: 30000, maxWait: 5000 });
}
