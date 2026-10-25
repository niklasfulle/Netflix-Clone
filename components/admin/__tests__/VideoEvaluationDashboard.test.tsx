import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';
import { VideoEvaluationDashboard } from '../VideoEvaluationDashboard';
jest.mock('swr');
jest.mock('@/components/providers/LanguageProvider', () => ({ useLanguage: () => ({ t: (key: string) => key, locale: 'en' }) }));
jest.mock('@/components/admin/AdminPageHeader', () => ({ AdminPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
const refresh = jest.fn();
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ evaluationId: 'evaluation-123' }) }); });
test('empty datasets cannot start a comparison', () => {
  jest.mocked(useSWR).mockReturnValue({ data: { exampleCount: 0, videoCount: 0, available: true, runs: [] }, mutate: refresh } as never);
  render(<VideoEvaluationDashboard />);
  expect(screen.getByRole('button', { name: 'Start comparison' })).toBeDisabled();
});
test('starts a background comparison with an idempotency request ID', async () => {
  jest.mocked(useSWR).mockReturnValue({ data: { exampleCount: 24, videoCount: 3, available: true, runs: [] }, mutate: refresh } as never);
  render(<VideoEvaluationDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Start comparison' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/video-evaluations', expect.objectContaining({ method: 'POST' })));
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
});
test('running jobs show progress and prevent another start', () => {
  jest.mocked(useSWR).mockReturnValue({ data: { exampleCount: 24, videoCount: 3, available: true, runs: [{ id: 'evaluation-123', status: 'RUNNING', model: 'neutral-profile', threshold: 0.65, createdAt: '2026-10-25T12:00:00Z', jobRun: { id: 'job-run-123', status: 'RUNNING', progress: 25 }, sampleCount: 24, samples: [], summary: { completed: 6, skipped: 0, tp: 3, fp: 1, fn: 2, tn: 0, precision: 0.75, recall: 0.6, f1: 2 / 3, categories: [] } }] }, mutate: refresh } as never);
  render(<VideoEvaluationDashboard />);
  expect(screen.getByRole('progressbar', { name: 'Comparison progress' })).toHaveAttribute('value', '25');
  expect(screen.getByRole('button', { name: 'Start comparison' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
});

test('positive-only evaluations explain the missing evidence for false suggestions', () => {
  jest.mocked(useSWR).mockReturnValue({ data: { exampleCount: 3, videoCount: 1, available: true, runs: [{ id: 'evaluation-123', status: 'SUCCEEDED', model: 'neutral-profile', threshold: 0.65, createdAt: '2026-10-25T12:00:00Z', jobRun: null, sampleCount: 3, samples: [], summary: { completed: 3, skipped: 0, tp: 2, fp: 0, fn: 1, tn: 0, precision: 1, recall: 2 / 3, f1: 0.8, categories: [] } }] }, mutate: refresh } as never);
  render(<VideoEvaluationDashboard />);
  expect(screen.getByText(/No absent judgments were evaluated/)).toBeInTheDocument();
});
