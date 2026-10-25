/** @jest-environment node */
jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: jest.fn() } }));
jest.mock('@/lib/category-import', () => ({ importCategories: jest.fn() }));
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { importCategories } from '@/lib/category-import';
import { MAX_CATEGORY_IMPORT_BYTES } from '@/lib/category-transfer';
import { POST } from '../route';

const audit = { succeeded: jest.fn(), failed: jest.fn(), denied: jest.fn() };
const body = { schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Nature' }] };
const request = (value: unknown) => new Request('http://localhost/api/categories/import', { method: 'POST', body: JSON.stringify(value) });
beforeEach(() => { jest.resetAllMocks(); jest.mocked(isCurrentUserAdmin).mockResolvedValue(true); jest.mocked(adminMutationAudit.begin).mockReturnValue(audit as never); });
test('requires administrator access before reading or importing data', async () => {
  jest.mocked(isCurrentUserAdmin).mockResolvedValue(false);
  expect((await POST(request(body))).status).toBe(403);
  expect(importCategories).not.toHaveBeenCalled(); expect(audit.denied).toHaveBeenCalled();
});
test('imports validated names and audits only counts', async () => {
  jest.mocked(importCategories).mockResolvedValue({ created: 1, updated: 0, unchanged: 0, total: 1 });
  const response = await POST(request(body)); expect(response.status).toBe(200);
  expect(importCategories).toHaveBeenCalledWith(body);
  expect(audit.succeeded).toHaveBeenCalledWith({ target: { type: 'category', id: 'import' }, metadata: { createdCount: 1, updatedCount: 0, unchangedCount: 0 } });
});
test('rejects malformed files, duplicate normalized names and unsupported versions before writes', async () => {
  expect((await POST(request({ ...body, schemaVersion: 2 }))).status).toBe(400);
  expect((await POST(request({ schemaVersion: 1, categories: [body.categories[0], body.categories[0]] }))).status).toBe(400);
  expect((await POST(new Request('http://localhost', { method: 'POST', body: '{' }))).status).toBe(400);
  expect(importCategories).not.toHaveBeenCalled();
});
test('enforces the actual streamed byte limit even without a content-length header', async () => {
  const response = await POST(new Request('http://localhost', { method: 'POST', body: ' '.repeat(MAX_CATEGORY_IMPORT_BYTES + 1) }));
  expect(response.status).toBe(413); expect(importCategories).not.toHaveBeenCalled();
});
test('sanitizes database failures', async () => {
  jest.mocked(importCategories).mockRejectedValue(new Error('private database URL'));
  const response = await POST(request(body)); expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'CATEGORY_IMPORT_UNAVAILABLE' });
});
