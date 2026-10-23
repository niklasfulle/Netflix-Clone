import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { removePlaylist } from '@/actions/playlist/remove-playlist';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import type { PlaylistDto } from '@/lib/api-types';
import PlaylistCard from '../PlaylistCard';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
jest.mock('@/actions/playlist/remove-playlist', () => ({ removePlaylist: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn(), success: jest.fn() } }));

const playlist: PlaylistDto = {
  id: 'playlist-1', title: 'Movie night',
  movies: [{ id: 'movie-1', thumbnailUrl: '/movie.jpg' }],
};

function renderCard(data = playlist, isLoading = false) {
  const edit = jest.fn();
  render(<LanguageProvider initialLocale="en"><PlaylistCard data={data} isLoading={isLoading} openModalEdit={edit} /></LanguageProvider>);
  return edit;
}

beforeEach(() => jest.clearAllMocks());

it('shows the title, count and a single play link for a normal playlist', () => {
  renderCard();
  expect(screen.getByRole('heading', { name: 'Movie night' })).toBeInTheDocument();
  expect(screen.getByText('1 title')).toBeInTheDocument();
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Play' })).toHaveAttribute('href', '/watch/playlist/playlist-1');
});

it('opens the existing edit flow', () => {
  const edit = renderCard();
  fireEvent.click(screen.getByRole('button', { name: 'Edit: Movie night' }));
  expect(edit).toHaveBeenCalledWith('playlist-1');
});

it('requires confirmation before deleting and reports a server rejection', async () => {
  jest.mocked(removePlaylist).mockResolvedValue({ error: 'Delete failed' });
  renderCard();
  fireEvent.click(screen.getByRole('button', { name: 'Delete: Movie night' }));
  expect(removePlaylist).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  await waitFor(() => expect(removePlaylist).toHaveBeenCalledWith('playlist-1'));
  expect(toast.error).toHaveBeenCalledWith('Delete failed');
});

it('cancels deletion without mutating the playlist', () => {
  renderCard();
  fireEvent.click(screen.getByRole('button', { name: 'Delete: Movie night' }));
  fireEvent.click(screen.getByRole('button', { name: 'No' }));
  expect(removePlaylist).not.toHaveBeenCalled();
});

it('handles a rejected delete request', async () => {
  jest.mocked(removePlaylist).mockRejectedValue(new Error('Offline'));
  renderCard();
  fireEvent.click(screen.getByRole('button', { name: 'Delete: Movie night' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong!'));
});

it('keeps an empty playlist editable without an unusable play link', () => {
  renderCard({ ...playlist, movies: [] });
  expect(screen.getByText('This playlist is empty.')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit: Movie night' })).toBeEnabled();
});

it('does not render duplicate content or allow actions during loading', () => {
  renderCard(playlist, true);
  expect(screen.getAllByRole('heading', { name: 'Movie night' })).toHaveLength(1);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit: Movie night' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete: Movie night' })).toBeDisabled();
});

it('keeps favorites automatic with its dedicated play link and no edit or delete actions', () => {
  renderCard({ ...playlist, id: 'favorites', kind: 'favorites' });
  expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Play favorites' })).toHaveAttribute('href', '/watch/playlist/favorites');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it.each([{ movies: undefined }, { movies: [] }])('keeps favorites without loaded entries safe to display: %j', ({ movies }) => {
  renderCard({ ...playlist, kind: 'favorites', movies });
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText('Mark movies and series with the heart to add them here.')).toBeInTheDocument();
});

it('disables editing and playback for a playlist whose id is unavailable', () => {
  renderCard({ title: 'Unavailable' });
  expect(screen.getByText('0 titles')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit: Unavailable' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Delete: Unavailable' })).toBeDisabled();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('notifies the viewer when a confirmed deletion succeeds', async () => {
  jest.mocked(removePlaylist).mockResolvedValue({ success: 'Playlist deleted' });
  renderCard();
  fireEvent.click(screen.getByRole('button', { name: 'Delete: Movie night' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Playlist deleted'));
});
