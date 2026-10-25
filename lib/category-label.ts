export function categoryLabel(category: { name: string; nameEn?: string | null }, locale: 'de' | 'en') {
  return locale === 'en' ? category.nameEn?.trim() || category.name : category.name;
}
