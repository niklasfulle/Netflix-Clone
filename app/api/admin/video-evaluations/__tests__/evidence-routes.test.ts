/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/video-evaluation/evidence', () => ({ readEvaluationFrame: jest.fn(), readEvaluationEvidence: jest.fn(), reviewEvaluationEvidence: jest.fn(), EvaluationEvidenceError: class extends Error { code: string; status: number; constructor(code: string, status = 409) { super(code); this.code = code; this.status = status; } } }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: () => ({ denied: jest.fn(), failed: jest.fn(), succeeded: jest.fn() }) } }));
import { currentUser } from '@/lib/auth';
import { readEvaluationFrame, readEvaluationEvidence, reviewEvaluationEvidence } from '@/lib/video-evaluation/evidence';
import { GET as getFrame } from '../[evaluationId]/samples/[sampleId]/frames/[index]/route';
import { GET as getEvidence, PATCH } from '../[evaluationId]/samples/[sampleId]/route';
const params = { evaluationId: 'evaluation-123', sampleId: 'sample-123', index: '0' };
const request = new Request('http://localhost/api/admin/video-evaluations');
beforeEach(() => { jest.clearAllMocks(); jest.mocked(currentUser).mockResolvedValue({ id: 'admin-user', role: 'ADMIN' } as never); });
test('unauthorized users cannot read images or model answers or submit reviews', async () => {
  jest.mocked(currentUser).mockResolvedValue({ role: 'USER' } as never);
  expect((await getFrame(request, { params: Promise.resolve(params) })).status).toBe(403);
  const context = { params: Promise.resolve({ evaluationId: params.evaluationId, sampleId: params.sampleId }) };
  expect((await getEvidence(request, context)).status).toBe(403);
  expect((await PATCH(request, context)).status).toBe(403);
  expect(readEvaluationFrame).not.toHaveBeenCalled(); expect(readEvaluationEvidence).not.toHaveBeenCalled(); expect(reviewEvaluationEvidence).not.toHaveBeenCalled();
});
test('images are returned privately with correct binary content and no public cache', async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); jest.mocked(readEvaluationFrame).mockResolvedValue(jpeg);
  const response = await getFrame(request, { params: Promise.resolve(params) });
  expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('Content-Type')).toBe('image/jpeg'); expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
});
test('invalid frame indices are rejected before accessing data', async () => {
  expect((await getFrame(request, { params: Promise.resolve({ ...params, index: '../3' }) })).status).toBe(400);
  expect(readEvaluationFrame).not.toHaveBeenCalled();
});
test('streams are size bounded before review parsing or persistence', async () => {
  const response = await PATCH(new Request(request.url, { method: 'PATCH', body: 'x'.repeat(16385) }), { params: Promise.resolve({ evaluationId: params.evaluationId, sampleId: params.sampleId }) });
  expect(response.status).toBe(413);
  expect(reviewEvaluationEvidence).not.toHaveBeenCalled();
});
test('review writes use the authenticated administrator and keep responses private', async () => {
  jest.mocked(reviewEvaluationEvidence).mockResolvedValue({ version: 1, labelCount: 1 });
  const body = { version: 0, judgments: [{ categoryId: 'nature', visibility: 'VISIBLE' }] };
  const response = await PATCH(new Request(request.url, { method: 'PATCH', body: JSON.stringify(body) }), { params: Promise.resolve({ evaluationId: params.evaluationId, sampleId: params.sampleId }) });
  expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(reviewEvaluationEvidence).toHaveBeenCalledWith(params.evaluationId, params.sampleId, body, 'admin-user');
});
