import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';
import VideoAnalysisPage from '@/app/(protected)/admin/video-analysis/page';
jest.mock('swr');
jest.mock('@/components/providers/LanguageProvider', () => ({ useLanguage: () => ({ t: (key: string) => key, locale: 'en' }) }));
const refresh = jest.fn();
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ analysisId: 'analysis-123' }) }); });
test('new analyses default to thorough sampling and explicitly selected standard sampling is submitted', async () => {
  jest.mocked(useSWR).mockReturnValue({ data: { items: [{ id: 'movie-123', title: 'Nature', type: 'Movie', duration: '20:00', videoAnalyses: [] }], totalPages: 1, model: { enabled: true, available: true, name: 'test' } }, mutate: refresh } as never);
  render(<VideoAnalysisPage />);
  expect(screen.getByRole('combobox', { name: 'Whole-video sampling' })).toHaveValue('THOROUGH');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'STANDARD' } });
  fireEvent.click(screen.getByRole('button', { name: 'Analyze video' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/video-analysis', expect.objectContaining({ body: JSON.stringify({ movieId: 'movie-123', force: false, samplingMode: 'STANDARD' }) })));
});
test('changing the picker cannot change the sampling profile of a resumed job', async () => {
  jest.mocked(useSWR).mockReturnValue({ data: { items: [{ id: 'movie-123', title: 'Nature', type: 'Movie', duration: '20:00', videoAnalyses: [{ id: 'analysis-123', status: 'FAILED', samplingProfile: 'standard-v1', processedCount: 10, sampleCount: 60, errorCode: null, jobRun: { id: 'job-run-123', status: 'FAILED', progress: 15 } }] }], totalPages: 1, model: { enabled: true, available: true, name: 'test' } }, mutate: refresh } as never);
  render(<VideoAnalysisPage />);
  expect(screen.getByText('Standard analysis')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Resume analysis' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/jobs/job-run-123', { method: 'POST' }));
});
