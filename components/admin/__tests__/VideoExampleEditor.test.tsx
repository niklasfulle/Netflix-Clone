import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';
import { useCategories } from '@/hooks/useCategories';
import { VideoExampleEditor } from '../VideoExampleEditor';

jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/hooks/useCategories', () => ({ useCategories: jest.fn() }));
const refresh = jest.fn();
const fingerprint = 'a'.repeat(64);
const data = { movie: { id: 'movie', title: 'Nature fixture' }, sourceFingerprint: fingerprint, durationSeconds: 60, examples: [] };
const requestId = 'a13b7f78-43cd-4a5e-a8de-6725ecf83703';
const originalUuid = crypto.randomUUID;
beforeAll(() => { Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => requestId }); });
afterAll(() => { Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: originalUuid }); });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSWR).mockReturnValue({ data, mutate: refresh } as never);
  jest.mocked(useCategories).mockReturnValue({ categories: [{ id: 'nature', name: 'Natur', nameEn: 'Nature', contentCount: 0 }], error: undefined, isLoading: false, refresh });
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'example', version: 1 }) });
});
function openEditor() {
  const result = render(<VideoExampleEditor movieId="movie" />);
  const video = result.container.querySelector('video')!;
  fireEvent.loadedMetadata(video);
  return { ...result, video };
}
test('marks actual playback positions and saves explicit category verdicts without treating unrated labels as negatives', async () => {
  const { video } = openEditor();
  video.currentTime = 12.25; fireEvent.timeUpdate(video); fireEvent.click(screen.getByRole('button', { name: 'Set start here' }));
  video.currentTime = 20.5; fireEvent.timeUpdate(video); fireEvent.click(screen.getByRole('button', { name: 'Set end here' }));
  expect(screen.getByLabelText('Start time')).toHaveValue('00:00:12.250');
  expect(screen.getByLabelText('End time')).toHaveValue('00:00:20.500');
  fireEvent.change(screen.getByRole('combobox', { name: 'Category verdict: Nature' }), { target: { value: 'ABSENT' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save example' }));
  expect(await screen.findByText('Example saved.')).toBeInTheDocument();
  const [, options] = jest.mocked(fetch).mock.calls[0];
  expect(JSON.parse(options!.body as string)).toMatchObject({ movieId: 'movie', sourceFingerprint: fingerprint, startSeconds: 12.25, endSeconds: 20.5, labels: [{ categoryId: 'nature', verdict: 'ABSENT' }], requestId });
  expect(screen.getByText('Unrated categories are not negative examples.')).toBeInTheDocument();
});
test('prevents saving reversed, out-of-bounds or unlabelled ranges', () => {
  openEditor();
  expect(screen.getByRole('button', { name: 'Save example' })).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Category verdict: Nature' }), { target: { value: 'PRESENT' } });
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '00:00:30' } });
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: '00:00:10' } });
  expect(screen.getByRole('button', { name: 'Save example' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: '00:02:00' } });
  expect(screen.getByRole('button', { name: 'Save example' })).toBeDisabled();
  expect(fetch).not.toHaveBeenCalled();
});
test('preserves the draft and displays a conflict when the source changes during saving', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: 'VIDEO_CHANGED' }) } as Response);
  openEditor();
  fireEvent.change(screen.getByRole('combobox', { name: 'Category verdict: Nature' }), { target: { value: 'UNCERTAIN' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save example' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Source video changed. Reload this page.'));
  expect(screen.getByRole('combobox', { name: 'Category verdict: Nature' })).toHaveValue('UNCERTAIN');
});
test('requires confirmation and sends the saved version when deleting an example', async () => {
  const example = { id: 'example', movieId: 'movie', startSeconds: 2, endSeconds: 5, labels: [{ categoryId: 'nature', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' }], note: '', version: 3, stale: false };
  jest.mocked(useSWR).mockReturnValue({ data: { ...data, examples: [example] }, mutate: refresh } as never);
  openEditor();
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete example' }));
  expect(await screen.findByText('Example deleted.')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/admin/video-examples', expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ id: 'example', version: 3 }) }));
});

test('explains an unmatched category search and allows creating and rating a category before saving', async () => {
  jest.mocked(fetch)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'outdoor', name: 'Außenaufnahme', nameEn: 'Outdoor scene' }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'example', version: 1 }) } as Response);
  openEditor();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search categories' }), { target: { value: 'Outdoor scene' } });
  expect(screen.getByText('No categories found.')).toBeInTheDocument();
  expect(screen.getByText('Searching does not select or create a category.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save example' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'Außenaufnahme' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  expect(await screen.findByText('Category created and marked as present.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Category verdict: Outdoor scene' })).toHaveValue('PRESENT');
  expect(screen.getByRole('button', { name: 'Save example' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save example' }));
  expect(await screen.findByText('Example saved.')).toBeInTheDocument();
  expect(fetch).toHaveBeenNthCalledWith(1, '/api/categories', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Außenaufnahme', nameEn: 'Outdoor scene' }) }));
  const [, options] = jest.mocked(fetch).mock.calls[1];
  expect(JSON.parse(options!.body as string).labels).toEqual([{ categoryId: 'outdoor', verdict: 'PRESENT' }]);
});

test('retains entered category names and keeps saving disabled when category creation fails', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'This category already exists.' } }) } as Response);
  openEditor();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search categories' }), { target: { value: 'Outdoor scene' } });
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'Außenaufnahme' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('This category already exists.');
  expect(screen.getByLabelText('Category name (German)')).toHaveValue('Außenaufnahme');
  expect(screen.getByRole('button', { name: 'Save example' })).toBeDisabled();
});

test('keeps an explicitly negative verdict when creating a new category', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: 'outdoor', name: 'Außenaufnahme', nameEn: 'Outdoor scene' }) } as Response);
  openEditor();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search categories' }), { target: { value: 'Outdoor scene' } });
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'Außenaufnahme' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Category verdict' }), { target: { value: 'ABSENT' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  expect(await screen.findByText('Category created and rated.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Category verdict: Outdoor scene' })).toHaveValue('ABSENT');
});
