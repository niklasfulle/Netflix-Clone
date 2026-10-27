import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ManualCategorization } from '../ManualCategorization';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/player/VideoPlayer', () => ({ __esModule: true, default: ({ onPositionChange }: { onPositionChange: (time: number, duration: number) => void }) => <button onClick={() => onPositionChange(35, 120)}>Set player position</button> }));
const categories = [{ id: 'forest', name: 'Wald', nameEn: 'Forest' }, { id: 'city', name: 'Stadt', nameEn: 'City' }];
jest.mock('@/hooks/useCategories', () => ({ useCategories: () => ({ categories }) }));
jest.mock('@/components/CategorySelect', () => ({ CategorySelect: ({ value, onChange, disabled }: { value: string[]; onChange: (ids: string[]) => void; disabled: boolean }) => <select aria-label="Categories" value={value} multiple disabled={disabled} onChange={event => onChange([...event.target.selectedOptions].map(option => option.value))}>{categories.map(category => <option key={category.id} value={category.id}>{category.nameEn}</option>)}</select> }));

const movie = { id: 'movie-1', title: 'Forest walk', type: 'Movie', version: 0, completed: false, categories: [], segments: [] };
beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn().mockImplementation(async (_url, options) => ({ ok: true, json: async () => options?.method === 'POST' ? { movie: { ...movie, version: 1 }, remaining: 0 } : { movie, remaining: 1 } }));
});
function mount() { return render(<LanguageProvider initialLocale="en"><ManualCategorization /></LanguageProvider>); }
function select(region: string, id: string) { fireEvent.change(within(screen.getByRole('region', { name: region })).getByRole('listbox'), { target: { value: id } }); }
it('saves whole-video and timeline assignments separately and keeps editing the current video', async () => {
  mount(); await screen.findByText('Forest walk');
  fireEvent.click(screen.getByText('Set player position'));
  select('Video categories', 'forest'); select('Category intervals', 'city');
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add interval' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/video-analysis', expect.objectContaining({ method: 'POST', body: JSON.stringify({ movieId: 'movie-1', version: 0, categoryIds: ['forest'], segments: [{ categoryId: 'city', startSeconds: 10, endSeconds: 20 }], complete: false }) })));
});
it('allows an explicit review without categories and then requests another video', async () => {
  mount(); await screen.findByText('Forest walk');
  fireEvent.click(screen.getByRole('button', { name: 'Save and next video' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/video-analysis?exclude=movie-1', expect.anything()));
  expect(fetch).toHaveBeenCalledWith('/api/admin/video-analysis', expect.objectContaining({ body: JSON.stringify({ movieId: 'movie-1', version: 0, categoryIds: [], segments: [], complete: true }) }));
});
it('prevents silently dropping the current unfinished interval on save', async () => {
  mount(); await screen.findByText('Forest walk'); select('Category intervals', 'city');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Add or discard the current interval');
  expect(jest.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true);
});
it('keeps edits when a skip is cancelled', async () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  mount(); await screen.findByText('Forest walk'); select('Video categories', 'forest');
  fireEvent.click(screen.getByRole('button', { name: 'Skip video' }));
  expect(confirm).toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1);
  confirm.mockRestore();
});
it('shows the empty queue without mounting a player', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ movie: null, remaining: 0 }) } as Response);
  mount(); expect(await screen.findByText('No uncategorized videos remain.')).toBeInTheDocument();
  expect(screen.queryByText('Set player position')).not.toBeInTheDocument();
});
