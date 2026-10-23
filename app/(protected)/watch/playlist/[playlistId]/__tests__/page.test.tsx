import { fireEvent, render, screen } from '@testing-library/react';
import WatchPlaylist from '../page';

const mockPush = jest.fn();
const mockPlaylist = jest.fn();
jest.mock('next/navigation', () => ({ useParams: () => ({ playlistId: 'playlist1' }), useRouter: () => ({ push: mockPush }) }));
jest.mock('@/hooks/playlists/usePlaylist', () => ({ __esModule: true, default: (...args: unknown[]) => mockPlaylist(...args) }));
jest.mock('@/components/player/VideoPlayer', () => ({
  __esModule: true,
  default: ({ items, playlistTitle, onBack }: any) => <div data-testid="player" data-items={JSON.stringify(items)}><h1>{playlistTitle}</h1><button onClick={onBack}>Leave player</button></div>,
}));

beforeEach(() => { jest.clearAllMocks(); });

it('preserves playlist order and title in the shared player', () => {
  mockPlaylist.mockReturnValue({ data: { title: 'Movie night', movies: [{ id: 'two', title: 'Second' }, { id: 'one', title: 'First' }] } });
  render(<WatchPlaylist />);
  expect(screen.getByRole('heading', { name: 'Movie night' })).toBeInTheDocument();
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!).map((movie: any) => movie.id)).toEqual(['two', 'one']);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/playlists');
});

it('supports the automatic favorites playlist', () => {
  mockPlaylist.mockReturnValue({ data: { kind: 'favorites', movies: [{ id: 'one', title: 'First' }] } });
  render(<WatchPlaylist />);
  expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
});

it('skips missing catalog entries without breaking the remaining queue', () => {
  mockPlaylist.mockReturnValue({ data: { movies: [null, { id: 'one', title: 'First' }] } });
  render(<WatchPlaylist />);
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!)).toHaveLength(1);
});

it('has a safe empty state instead of rendering a video with no source', () => {
  mockPlaylist.mockReturnValue({ data: { movies: [] } });
  render(<WatchPlaylist />);
  expect(screen.getByText('This playlist is empty.')).toBeInTheDocument();
  expect(screen.queryByTestId('player')).not.toBeInTheDocument();
});

it('falls back to a playlist label and a readable title for incomplete metadata', () => {
  mockPlaylist.mockReturnValue({ data: { movies: [{ id: 'one' }, { title: 'Removed' }] } });
  render(<WatchPlaylist />);
  expect(screen.getByRole('heading', { name: 'Playlist' })).toBeInTheDocument();
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!)).toEqual([{ id: 'one', title: 'Now playing' }]);
});

it('handles a playlist response without a movie collection', () => {
  mockPlaylist.mockReturnValue({ data: {} });
  render(<WatchPlaylist />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(mockPush).toHaveBeenCalledWith('/playlists');
});

it('shows a loading state while the playlist is being fetched', () => {
  mockPlaylist.mockReturnValue({ data: undefined, isLoading: true });
  render(<WatchPlaylist />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading...');
});
