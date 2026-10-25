/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: jest.fn() } }));
jest.mock('@/lib/video-examples/service', () => ({ readVideoExamples: jest.fn(), saveVideoExample: jest.fn(), removeVideoExample: jest.fn() }));
import { currentUser } from '@/lib/auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { readVideoExamples, saveVideoExample, removeVideoExample } from '@/lib/video-examples/service';
import { VideoExampleError } from '@/lib/video-examples/validation';
import { GET, POST, PATCH, DELETE } from '../route';

const audit = { succeeded: jest.fn(), denied: jest.fn(), failed: jest.fn() };
const body = { movieId: 'movie', sourceFingerprint: 'a'.repeat(64), startSeconds: 2, endSeconds: 5, labels: [{ categoryId: 'category', verdict: 'ABSENT' }], note: '', requestId: 'a13b7f78-43cd-4a5e-a8de-6725ecf83703' };
const request = (value: unknown) => new Request('http://localhost/api/admin/video-examples?movieId=movie', { method: 'POST', body: JSON.stringify(value) });
beforeEach(() => { jest.resetAllMocks(); jest.mocked(currentUser).mockResolvedValue({ id: 'admin', role: 'ADMIN' } as never); jest.mocked(adminMutationAudit.begin).mockReturnValue(audit as never); });
test('requires admin access for every read and mutation', async () => {
  jest.mocked(currentUser).mockResolvedValue({ id: 'user', role: 'USER' } as never);
  for (const handler of [GET, POST, PATCH, DELETE]) expect((await handler(request(body))).status).toBe(403);
  expect(readVideoExamples).not.toHaveBeenCalled(); expect(saveVideoExample).not.toHaveBeenCalled(); expect(removeVideoExample).not.toHaveBeenCalled();
});
test('uses the authenticated reviewer and audits counts without labels or notes', async () => {
  jest.mocked(saveVideoExample).mockResolvedValue({ id: 'example', version: 1 });
  expect((await POST(request(body))).status).toBe(201);
  expect(saveVideoExample).toHaveBeenCalledWith(body, 'admin');
  expect(audit.succeeded).toHaveBeenCalledWith({ target: { type: 'video_example', id: 'example' }, metadata: { labelCount: 1 } });
});
test('rejects malformed ranges, spoofed reviewer fields and missing update versions', async () => {
  expect((await POST(request({ ...body, reviewerId: 'other' }))).status).toBe(400);
  expect((await POST(request({ ...body, endSeconds: 1 }))).status).toBe(400);
  expect((await PATCH(request({ ...body, id: 'example' }))).status).toBe(400);
  expect((await DELETE(request({ id: 'example' }))).status).toBe(400);
  expect(saveVideoExample).not.toHaveBeenCalled();
});
test('returns controlled conflicts and never exposes internal error messages', async () => {
  jest.mocked(saveVideoExample).mockRejectedValueOnce(new VideoExampleError('VIDEO_CHANGED')).mockRejectedValueOnce(new Error('private filesystem path'));
  expect((await POST(request(body))).status).toBe(409);
  const failed = await POST(request(body)); expect(failed.status).toBe(503); expect(await failed.json()).toEqual({ error: 'EXAMPLES_UNAVAILABLE' });
});
test('serves private non-cacheable results and deletes only an explicit version', async () => {
  jest.mocked(readVideoExamples).mockResolvedValue({ examples: [] } as never);
  const response = await GET(request(body)); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect((await DELETE(request({ id: 'example', version: 3 }))).status).toBe(200);
  expect(removeVideoExample).toHaveBeenCalledWith('example', 3);
});
