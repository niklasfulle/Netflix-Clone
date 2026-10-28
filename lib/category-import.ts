import { db } from '@/lib/db';
import { categoryImportPreview, type CategoryImportDocument } from './category-transfer';
import { suggestedCategoryColor } from './category-color';

export async function importCategories(document: CategoryImportDocument) {
  return db.$transaction(async transaction => {
    const existing = await transaction.category.findMany({
      select: { name: true, nameEn: true, color: true },
    });
    const result = categoryImportPreview(document, existing);
    const oldByName = new Map(existing.map(category => [category.name.toLowerCase(), category]));
    const colors = existing.map(category => category.color);
    for (const category of document.categories) {
      const key = category.name.toLowerCase();
      const old = oldByName.get(key);
      if (old?.name === category.name && old.nameEn === category.nameEn && (category.color === undefined || old.color?.toUpperCase() === category.color)) continue;
      const color = category.color ?? old?.color ?? suggestedCategoryColor(colors);
      await transaction.category.upsert({ where: { normalizedName: key }, update: category, create: { ...category, color, normalizedName: key } });
      colors.push(color);
    }
    return result;
  }, { timeout: 30000, maxWait: 5000 });
}
