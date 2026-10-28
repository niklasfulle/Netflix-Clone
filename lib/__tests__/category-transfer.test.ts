/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { $transaction: jest.fn() } }));
import { db } from '@/lib/db';
import { importCategories } from '../category-import';
import { CategoryImportSchema, categoryImportPreview } from '../category-transfer';

const document = { schemaVersion: 1 as const, categories: [{ name: 'Natur', nameEn: 'Nature' }, { name: 'Stadt', nameEn: 'Urban' }, { name: 'Meer', nameEn: 'Sea' }] };
const existing = [{ name: 'Natur', nameEn: 'Nature' }, { name: 'Stadt', nameEn: 'City' }];
test('normalizes bilingual names and rejects duplicate names, missing translations and oversized lists', () => {
  expect(CategoryImportSchema.parse({ schemaVersion: 1, categories: [{ name: '  Hinter   den Kulissen ', nameEn: ' Behind  the scenes ' }] }).categories[0]).toEqual({ name: 'Hinter den Kulissen', nameEn: 'Behind the scenes' });
  expect(CategoryImportSchema.safeParse({ schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Nature' }, { name: 'Ｎａｔｕｒ', nameEn: 'Nature' }] }).success).toBe(false);
  expect(CategoryImportSchema.safeParse({ schemaVersion: 1, categories: [{ name: 'Natur' }] }).success).toBe(false);
  expect(CategoryImportSchema.safeParse({ schemaVersion: 1, categories: Array(1001).fill(document.categories[0]) }).success).toBe(false);
  expect(CategoryImportSchema.safeParse({ ...document, privateField: 'ignored' }).success).toBe(false);
});
test('previews new, updated and unchanged categories without IDs', () => {
  expect(categoryImportPreview(document, existing)).toEqual({ created: 1, updated: 1, unchanged: 1, total: 3 });
});

test('previews color edits but preserves current colors for older exports', () => {
  const current = [{ name: 'Natur', nameEn: 'Nature', color: '#38BDF8' }];
  expect(categoryImportPreview({ schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Nature', color: '#FB7185' }] }, current).updated).toBe(1);
  expect(categoryImportPreview({ schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Nature' }] }, current).unchanged).toBe(1);
});

test('imports color-only changes while retaining stable category identities', async () => {
  const transaction = { category: { findMany: jest.fn().mockResolvedValue([{ name: 'Natur', nameEn: 'Nature', color: '#38BDF8' }]), upsert: jest.fn() } };
  (db.$transaction as jest.Mock).mockImplementation(callback => callback(transaction));
  const category = { name: 'Natur', nameEn: 'Nature', color: '#FB7185' };
  expect(await importCategories({ schemaVersion: 1, categories: [category] })).toEqual({ created: 0, updated: 1, unchanged: 0, total: 1 });
  expect(transaction.category.upsert).toHaveBeenCalledWith({ where: { normalizedName: 'natur' }, update: category, create: { ...category, normalizedName: 'natur' } });
});
test('merges atomically by normalized German name without replacing IDs or deleting assignments', async () => {
  const transaction = { category: { findMany: jest.fn().mockResolvedValue(existing), upsert: jest.fn(), deleteMany: jest.fn() }, movieCategory: { deleteMany: jest.fn() } };
  (db.$transaction as jest.Mock).mockImplementation(callback => callback(transaction));
  expect(await importCategories(document)).toEqual({ created: 1, updated: 1, unchanged: 1, total: 3 });
  expect(transaction.category.upsert).toHaveBeenCalledTimes(2);
  expect(transaction.category.upsert).toHaveBeenCalledWith({ where: { normalizedName: 'stadt' }, update: { name: 'Stadt', nameEn: 'Urban' }, create: { name: 'Stadt', nameEn: 'Urban', normalizedName: 'stadt', color: expect.stringMatching(/^#[0-9A-F]{6}$/) } });
  expect(transaction.category.deleteMany).not.toHaveBeenCalled();
  expect(transaction.movieCategory.deleteMany).not.toHaveBeenCalled();
});
