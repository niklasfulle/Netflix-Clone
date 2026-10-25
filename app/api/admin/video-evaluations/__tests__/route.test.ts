/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/video-evaluation/service', () => ({ readVideoEvaluations: jest.fn(), submitVideoEvaluation: jest.fn() }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: () => ({ denied: jest.fn(), failed: jest.fn(), succeeded: jest.fn() }) } }));
import { currentUser } from '@/lib/auth';
import { readVideoEvaluations, submitVideoEvaluation } from '@/lib/video-evaluation/service';
import { GET, POST } from '../route';
const request = (body: object) => new Request('http://localhost/api/admin/video-evaluations', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => { jest.clearAllMocks(); jest.mocked(currentUser).mockResolvedValue({ id: 'admin-user', role: 'ADMIN' } as never); });
test('denies reads and writes before accessing evaluation data for non-admin users', async () => {
  jest.mocked(currentUser).mockResolvedValue({ role: 'USER' } as never);
  expect((await GET(new Request('http://localhost/api/admin/video-evaluations'))).status).toBe(403);
  expect((await POST(request({}))).status).toBe(403);
  expect(readVideoEvaluations).not.toHaveBeenCalled(); expect(submitVideoEvaluation).not.toHaveBeenCalled();
});
test('validates bounded input and does not accept a client supplied actor', async () => {
  expect((await POST(request({ requestId: 'bad' }))).status).toBe(400);
  expect((await POST(request({ requestId: '7abef277-c114-4872-8ec9-d6c0c1d445cf', actorUserId: 'other' }))).status).toBe(400);
});
test('queues with the authenticated actor and disables caching', async () => {
  jest.mocked(submitVideoEvaluation).mockResolvedValue({ evaluationId: 'evaluation', jobRunId: 'job', duplicate: false });
  const response = await POST(request({ requestId: '7abef277-c114-4872-8ec9-d6c0c1d445cf' }));
  expect(response.status).toBe(202); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(submitVideoEvaluation).toHaveBeenCalledWith('7abef277-c114-4872-8ec9-d6c0c1d445cf', 'admin-user');
});
