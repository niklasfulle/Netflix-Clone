import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR, { mutate } from 'swr';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { VideoAnalysisReview } from '../VideoAnalysisReview';

jest.mock('swr', () => ({ __esModule: true, default: jest.fn(), mutate: jest.fn() }));
const refresh = jest.fn();
const onReviewed = jest.fn();
const data = {
  id: 'analysis', status: 'SUCCEEDED', processedCount: 6, sampleCount: 6, errorCode: null,
  jobRun: { id: 'job', status: 'SUCCEEDED', progress: 100 },
  suggestions: [
    { id: 'new', name: 'Testbild', confidence: 0.9, evidence: [12.5], state: 'PENDING', categoryId: null, category: null },
    { id: 'existing', name: 'Old name', confidence: 0.8, evidence: [31], state: 'ACCEPTED', categoryId: 'category', category: { name: 'Renamed category' } },
  ],
};
function view() { return render(<LanguageProvider initialLocale="en"><VideoAnalysisReview analysisId="analysis" movieId="movie" onReviewed={onReviewed} /></LanguageProvider>); }
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSWR).mockReturnValue({ data, mutate: refresh } as never);
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ changed: 1 }) });
});
test('distinguishes new and existing categories without loading the video automatically', () => {
  const { container } = view();
  expect(screen.getByText('New category suggestion')).toBeInTheDocument();
  expect(screen.getByText('Existing category')).toBeInTheDocument();
  expect(screen.getByText('Renamed category')).toBeInTheDocument();
  expect(container.querySelector('video')).toBeNull();
  expect(screen.getByRole('button', { name: 'Accept and assign categories' })).toBeDisabled();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
test.each(['Accept and assign categories', 'Reject suggestions'])('submits only selected pending suggestions: %s', async button => {
  view();
  fireEvent.click(screen.getByRole('button', { name: 'Select all suggestions' }));
  fireEvent.click(screen.getByRole('button', { name: button }));
  await waitFor(() => expect(onReviewed).toHaveBeenCalledTimes(1));
  expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/video-analysis/analysis', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ ids: ['new'], action: button.startsWith('Accept') ? 'ACCEPT' : 'REJECT' }) }));
  expect(mutate).toHaveBeenCalledWith('/api/categories', undefined, expect.anything());
});
test('opens evidence at the selected time only after an explicit click', () => {
  const { container } = view();
  fireEvent.click(screen.getByRole('button', { name: 'View segment: 0:12' }));
  const video = container.querySelector('video')!;
  expect(video).toHaveAttribute('src', '/api/video/movie');
  fireEvent.loadedMetadata(video);
  expect(video.currentTime).toBe(12.5);
  fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
  expect(container.querySelector('video')).toBeNull();
});
test('keeps failed review visible and does not report success', async () => {
  jest.mocked(globalThis.fetch).mockResolvedValue({ ok: false, json: async () => ({ error: 'VIDEO_CHANGED' }) } as Response);
  view();
  fireEvent.click(screen.getByRole('button', { name: 'Select all suggestions' }));
  fireEvent.click(screen.getByRole('button', { name: 'Accept and assign categories' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('The video has changed. Start a new analysis.');
  expect(onReviewed).not.toHaveBeenCalled();
});
test('does not allow accepting results from a cancelled job', () => {
  jest.mocked(useSWR).mockReturnValue({ data: { ...data, jobRun: { ...data.jobRun, status: 'CANCELLED' } }, mutate: refresh } as never);
  view();
  expect(screen.queryByRole('button', { name: 'Accept and assign categories' })).not.toBeInTheDocument();
});
