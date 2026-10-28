import { CATEGORY_COLOR_PALETTE, categoryColor, suggestedCategoryColor } from '../category-color';
import { CategoryCreateSchema } from '../category-validation';

it('honors an edited color and keeps the automatic fallback independent of names and ordering', () => {
  expect(categoryColor({ id: 'forest', color: '#12ab34' })).toBe('#12AB34');
  expect(categoryColor({ id: 'forest', color: 'invalid' })).toBe(categoryColor({ id: 'forest' }));
  expect(categoryColor({ id: 'forest' })).toBe(categoryColor({ id: 'forest', color: null }));
});

it('uses every palette color before reusing a color and chooses another color after a custom edit', () => {
  const assigned: string[] = [];
  for (const _ of CATEGORY_COLOR_PALETTE) assigned.push(suggestedCategoryColor(assigned));
  expect(new Set(assigned).size).toBe(CATEGORY_COLOR_PALETTE.length);
  expect(CATEGORY_COLOR_PALETTE).toContain(suggestedCategoryColor(assigned));
  expect(suggestedCategoryColor(['#38bdf8'])).not.toBe('#38BDF8');
});

it.each(['red', '#123', '#12345678', 'url(example)', '#ZZZZZZ'])('rejects unsafe or malformed custom colors: %s', color => {
  expect(CategoryCreateSchema.safeParse({ name: 'Wald', nameEn: 'Forest', color }).success).toBe(false);
});

it('normalizes valid colors while accepting older category documents without a color', () => {
  expect(CategoryCreateSchema.parse({ name: 'Wald', nameEn: 'Forest', color: '#12ab34' }).color).toBe('#12AB34');
  expect(CategoryCreateSchema.parse({ name: 'Wald', nameEn: 'Forest' }).color).toBeUndefined();
});
