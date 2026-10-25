/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/db', () => ({ db: { movie: { findMany: jest.fn(), count: jest.fn() }, videoAnalysis: { findUnique: jest.fn() } } }));
jest.mock('@/lib/admin-mutation-audit', () => ({ adminMutationAudit: { begin: jest.fn() } }));
jest.mock('@/lib/video-analysis/service', () => ({ submitVideoAnalysis: jest.fn(), reviewVideoSuggestions: jest.fn() }));
jest.mock('@/lib/video-analysis/model', () => ({ analysisModelAvailable: jest.fn(), videoAnalysisEnabled: jest.fn(() => true) }));

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { submitVideoAnalysis, reviewVideoSuggestions } from '@/lib/video-analysis/service';
import { analysisModelAvailable } from '@/lib/video-analysis/model';
import { VideoAnalysisError } from '@/lib/video-analysis/contracts';
import { GET, POST } from '../route';
import { GET as detail, PATCH } from '../[analysisId]/route';

const audit = { denied: jest.fn(), failed: jest.fn(), succeeded: jest.fn() };
const context = { params: Promise.resolve({ analysisId: 'analysis' }) };
const request = (body: unknown) => new Request('http://localhost/api/admin/video-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(currentUser).mockResolvedValue({ id: 'admin', role: 'ADMIN' } as never);
  jest.mocked(adminMutationAudit.begin).mockReturnValue(audit as never);
});

test('requires administrator access for listing, submission, detail and review', async () => {
  jest.mocked(currentUser).mockResolvedValue({ role: 'USER' } as never);
  expect((await GET(request({}))).status).toBe(403);
  expect((await POST(request({ movieId: 'movie' }))).status).toBe(403);
  expect((await detail(request({}), context)).status).toBe(403);
  expect((await PATCH(request({ ids: ['s'], action: 'ACCEPT' }), context)).status).toBe(403);
  expect(submitVideoAnalysis).not.toHaveBeenCalled();
  expect(reviewVideoSuggestions).not.toHaveBeenCalled();
});
test('rejects invalid inputs without submitting or mutating categories', async () => {
  expect((await POST(request({ movieId: '', extra: true }))).status).toBe(400);
  expect((await PATCH(request({ ids: [], action: 'ACCEPT' }), context)).status).toBe(400);
  expect((await GET(new Request('http://localhost/api/admin/video-analysis?page=0'))).status).toBe(400);
  expect(submitVideoAnalysis).not.toHaveBeenCalled();
});
test('queues the requested video and audits its analysis identifier', async () => {
  jest.mocked(submitVideoAnalysis).mockResolvedValue({ analysisId: 'analysis', jobRunId: 'job', duplicate: false });
  expect((await POST(request({ movieId: 'movie', force: true }))).status).toBe(202);
  expect(submitVideoAnalysis).toHaveBeenCalledWith('movie', 'admin', true);
  expect(audit.succeeded).toHaveBeenCalledWith({ target: { type: 'video_analysis', id: 'analysis' }, metadata: { duplicate: false } });
});
test('returns bounded pages and model availability without making an analysis', async () => {
  jest.mocked(db.movie.findMany).mockResolvedValue([]);
  jest.mocked(db.movie.count).mockResolvedValue(21);
  jest.mocked(analysisModelAvailable).mockResolvedValue(false);
  const response = await GET(new Request('http://localhost/api/admin/video-analysis?page=2&search=demo'));
  expect(await response.json()).toMatchObject({ total: 21, totalPages: 2, model: { available: false } });
  expect(db.movie.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20, where: { title: { contains: 'demo', mode: 'insensitive' } } }));
});
test('does not leak internal errors and returns known permanent conflicts', async () => {
  jest.mocked(submitVideoAnalysis).mockRejectedValue(new Error('private/internal/path'));
  const response = await POST(request({ movieId: 'movie' }));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'ANALYSIS_UNAVAILABLE' });
  jest.mocked(submitVideoAnalysis).mockRejectedValue(new VideoAnalysisError('VIDEO_CHANGED', true));
  expect((await POST(request({ movieId: 'movie' }))).status).toBe(409);
});
test.each(['ACCEPT', 'REJECT'] as const)('reviews only explicitly selected suggestions: %s', async action => {
  jest.mocked(reviewVideoSuggestions).mockResolvedValue({ changed: 1, movieId: 'movie' });
  expect((await PATCH(request({ ids: ['suggestion'], action }), context)).status).toBe(200);
  expect(reviewVideoSuggestions).toHaveBeenCalledWith('analysis', ['suggestion'], action);
  expect(audit.succeeded).toHaveBeenCalledWith(expect.objectContaining({ metadata: { acceptedCount: action === 'ACCEPT' ? 1 : 0, rejectedCount: action === 'REJECT' ? 1 : 0 } }));
});
test('returns not found for missing analysis and conflict for stale results', async () => {
  jest.mocked(db.videoAnalysis.findUnique).mockResolvedValue(null);
  expect((await detail(request({}), context)).status).toBe(404);
  jest.mocked(reviewVideoSuggestions).mockRejectedValue(new VideoAnalysisError('VIDEO_CHANGED', true));
  expect((await PATCH(request({ ids: ['s'], action: 'ACCEPT' }), context)).status).toBe(409);
});
