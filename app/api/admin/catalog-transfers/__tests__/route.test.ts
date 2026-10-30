/** @jest-environment node */
jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: jest.fn() } }));
jest.mock('@/lib/catalog-transfers/store', () => ({
  TransferError: class extends Error { constructor(message: string, readonly status = 400) { super(message); } },
  queueTransfer: jest.fn(), saveUpload: jest.fn(), transferOverview: jest.fn(), downloadTransfer: jest.fn(),
}));

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { queueTransfer, saveUpload, transferOverview, downloadTransfer, TransferError } from '@/lib/catalog-transfers/store';
import { GET, POST, PUT, PATCH } from '../route';
import { GET as download } from '../[jobId]/download/route';

const audit = { succeeded: jest.fn(), denied: jest.fn(), failed: jest.fn() };
const id = '550e8400-e29b-41d4-a716-446655440000';
function request(method: string, body?: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/admin/catalog-transfers', { method, headers: { origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

beforeEach(() => {
  jest.clearAllMocks();
  (isCurrentUserAdmin as jest.Mock).mockResolvedValue(true);
  (adminMutationAudit.begin as jest.Mock).mockReturnValue(audit);
  (queueTransfer as jest.Mock).mockResolvedValue({ id, state: 'queued' });
});

it('rejects unauthorized reads, downloads and every mutation before touching storage', async () => {
  (isCurrentUserAdmin as jest.Mock).mockResolvedValue(false);
  for (const handler of [GET, POST, PUT, PATCH]) expect((await handler(request('POST'))).status).toBe(403);
  expect((await download(request('GET'), { params: Promise.resolve({ jobId: id }) })).status).toBe(403);
  expect(queueTransfer).not.toHaveBeenCalled();
  expect(saveUpload).not.toHaveBeenCalled();
  expect(downloadTransfer).not.toHaveBeenCalled();
});

it.each([POST, PUT, PATCH])('rejects cross-origin mutations', async handler => {
  expect((await handler(request('POST', {}, 'https://untrusted.example'))).status).toBe(403);
  expect(queueTransfer).not.toHaveBeenCalled();
  expect(saveUpload).not.toHaveBeenCalled();
});

it('returns uncached capabilities and progress', async () => {
  (transferOverview as jest.Mock).mockResolvedValue({ environment: 'staging', available: true, canImport: true, jobs: [] });
  const response = await GET();
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toMatchObject({ canImport: true });
});

it('queues an audited export without waiting for the export process', async () => {
  expect((await POST(request('POST'))).status).toBe(202);
  expect(queueTransfer).toHaveBeenCalledWith({ operation: 'export' });
  expect(audit.succeeded).toHaveBeenCalledWith({ target: { type: 'catalog_snapshot', id } });
});

it('requires a checked upload and confirmation for an import', async () => {
  expect((await PUT(request('PUT', { uploadId: '../file', confirmation: 'netflix_local' }))).status).toBe(400);
  expect(queueTransfer).not.toHaveBeenCalled();
  expect((await PUT(request('PUT', { uploadId: id, confirmation: 'netflix_local' }))).status).toBe(202);
  expect(queueTransfer).toHaveBeenCalledWith({ operation: 'import', uploadId: id, confirmation: 'netflix_local' });
});

it('returns a bounded upload preview and preserves explicit production rejection', async () => {
  (saveUpload as jest.Mock).mockResolvedValue({ uploadId: id, preview: {} });
  expect((await PATCH(request('PATCH', {}))).status).toBe(200);
  (queueTransfer as jest.Mock).mockRejectedValue(new TransferError('Production imports forbidden', 403));
  expect((await PUT(request('PUT', { uploadId: id, confirmation: 'netflix_local' }))).status).toBe(403);
});

it('does not expose raw process errors or allow arbitrary download kinds', async () => {
  (queueTransfer as jest.Mock).mockRejectedValue(new Error('private process output'));
  const response = await POST(request('POST'));
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain('private process output');
  expect((await download(new Request('http://localhost:3000/api/admin/catalog-transfers/id/download?kind=arbitrary'), { params: Promise.resolve({ jobId: id }) })).status).toBe(400);
});
