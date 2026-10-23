import { fireEvent, render, screen } from '@testing-library/react';
import RandomWatch from '../page';
import { RANDOM_PLAYLIST_STORAGE_KEY } from '@/lib/random-playlist';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/components/player/VideoPlayer', () => ({
  __esModule: true,
  default: ({ items, playlistTitle, onBack }: any) => <div data-testid="player" data-items={JSON.stringify(items)}><h1>{playlistTitle}</h1><button onClick={onBack}>Leave player</button></div>,
}));

beforeEach(() => { jest.clearAllMocks(); sessionStorage.clear(); });

it('shows an empty state when no temporary playlist exists', () => {
  render(<RandomWatch />);
  expect(screen.getByText('Playlist not found')).toBeInTheDocument();
});

it.each([undefined, '//outside.example', 'https://outside.example'])('uses the home page for an unsafe or absent return path: %s', returnPath => {
  sessionStorage.setItem(RANDOM_PLAYLIST_STORAGE_KEY, JSON.stringify({ title: 'Actor', returnPath, movies: [{ id: 'one', title: 'First' }] }));
  render(<RandomWatch />);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('allows returning home when the temporary playlist is unavailable', () => {
  render(<RandomWatch />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('still offers a safe exit when browser storage cannot be read or cleared', () => {
  const read = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
  const clear = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Storage disabled'); });
  render(<RandomWatch />);
  expect(screen.getByText('Playlist not found')).toBeInTheDocument();
  read.mockRestore(); clear.mockRestore();
});

it('loads the temporary playlist without creating a database playlist', () => {
  sessionStorage.setItem(RANDOM_PLAYLIST_STORAGE_KEY, JSON.stringify({ title: 'Test Actor', returnPath: '/movies', movies: [{ id: 'one', title: 'First' }, { id: 'two', title: 'Second' }] }));
  render(<RandomWatch />);
  expect(screen.getByRole('heading', { name: 'Random · Test Actor' })).toBeInTheDocument();
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!).map((movie: any) => movie.id)).toEqual(['one', 'two']);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/movies');
});

it.each(['invalid-json', JSON.stringify({ title: 'Broken', movies: null })])('discards malformed temporary data', raw => {
  sessionStorage.setItem(RANDOM_PLAYLIST_STORAGE_KEY, raw); render(<RandomWatch />);
  expect(screen.getByText('Playlist not found')).toBeInTheDocument();
  expect(sessionStorage.getItem(RANDOM_PLAYLIST_STORAGE_KEY)).toBeNull();
});
