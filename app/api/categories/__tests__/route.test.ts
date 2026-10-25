/** @jest-environment node */
jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { category: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }, movie: { delete: jest.fn() } } }));
const mockAudit = { succeeded: jest.fn(), denied: jest.fn(), failed: jest.fn() };
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: () => mockAudit } }));

import { Prisma } from '@prisma/client';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { GET, POST, PATCH, DELETE } from '../route';

const request = (method: string, body: unknown) => new Request('http://localhost/api/categories', { method, body: JSON.stringify(body) });
beforeEach(() => { jest.resetAllMocks(); jest.mocked(isCurrentUserAdmin).mockResolvedValue(true); });

it.each(['GET', 'POST', 'PATCH', 'DELETE'])('requires administrator access before processing %s', async method => {
  jest.mocked(isCurrentUserAdmin).mockResolvedValue(false);
  const response = method === 'GET' ? await GET() : await ({ POST, PATCH, DELETE }[method as 'POST'])(request(method, { id: 'c', name: 'Category', nameEn: 'Category' }));
  expect(response.status).toBe(403);
  expect(db.category.findMany).not.toHaveBeenCalled();
  expect(db.category.create).not.toHaveBeenCalled();
  expect(db.category.update).not.toHaveBeenCalled();
  expect(db.category.delete).not.toHaveBeenCalled();
});

it('lists names and assignment counts without loading the linked videos', async () => {
  jest.mocked(db.category.findMany).mockResolvedValue([{ id: 'c', name: 'Documentary', nameEn: 'Documentary', _count: { movies: 2 } }] as never);
  const response = await GET();
  expect(await response.json()).toEqual({ categories: [{ id: 'c', name: 'Documentary', nameEn: 'Documentary', contentCount: 2 }] });
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});

it('normalizes category names and records a successful creation', async () => {
  jest.mocked(db.category.create).mockResolvedValue({ id: 'c', name: 'Behind Scenes', nameEn: 'Behind Scenes' } as never);
  const response = await POST(request('POST', { name: '  Behind   Scenes  ', nameEn: '  Behind   Scenes  ' }));
  expect(response.status).toBe(201);
  expect(db.category.create).toHaveBeenCalledWith({ data: { name: 'Behind Scenes', nameEn: 'Behind Scenes', normalizedName: 'behind scenes' } });
  expect(mockAudit.succeeded).toHaveBeenCalledWith({ target: { type: 'category', id: 'c' } });
});

it.each([{ name: ' ', nameEn: ' ' }, { name: 'x', nameEn: 'x'.repeat(81) }, { name: 12 }, null])('rejects invalid category input: %s', async body => {
  expect((await POST(request('POST', body))).status).toBe(400);
  expect(db.category.create).not.toHaveBeenCalled();
});

it.each([{ name: 'Deutsch' }, { name: 'Deutsch', nameEn: '' }, { nameEn: 'English' }])('requires both languages: %s', async body => {
  expect((await POST(request('POST', body))).status).toBe(400);
  expect(db.category.create).not.toHaveBeenCalled();
});

it('reports duplicate names as a conflict, including concurrent creates', async () => {
  jest.mocked(db.category.create).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.22.0' }));
  expect((await POST(request('POST', { name: 'Existing', nameEn: 'Existing' }))).status).toBe(409);
});

it('renames a category by its stable ID', async () => {
  jest.mocked(db.category.update).mockResolvedValue({ id: 'c', name: 'New name', nameEn: 'New name' } as never);
  expect((await PATCH(request('PATCH', { id: 'c', name: 'New name', nameEn: 'New name' }))).status).toBe(200);
  expect(db.category.update).toHaveBeenCalledWith({ where: { id: 'c' }, data: { name: 'New name', nameEn: 'New name', normalizedName: 'new name' } });
});

it('removes only the category; movie deletion is never requested', async () => {
  const response = await DELETE(new Request('http://localhost/api/categories?id=c', { method: 'DELETE' }));
  expect(response.status).toBe(200);
  expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 'c' } });
  expect(db.movie.delete).not.toHaveBeenCalled();
});

it('returns controlled errors for missing IDs, missing records, malformed JSON and database failures', async () => {
  expect((await DELETE(new Request('http://localhost/api/categories'))).status).toBe(400);
  expect((await PATCH(request('PATCH', { name: 'Missing ID', nameEn: 'Missing ID' }))).status).toBe(400);
  jest.mocked(db.category.delete).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '5.22.0' }));
  expect((await DELETE(new Request('http://localhost/api/categories?id=gone'))).status).toBe(404);
  expect((await POST(new Request('http://localhost/api/categories', { method: 'POST', body: '{broken' }))).status).toBe(400);
  jest.mocked(db.category.findMany).mockRejectedValue(new Error('private database details'));
  const response = await GET();
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain('private database details');
});
