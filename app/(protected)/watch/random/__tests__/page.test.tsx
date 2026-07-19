import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RandomWatch from '../page';
import {
  RANDOM_PLAYLIST_STORAGE_KEY,
  type RandomPlaylist,
} from '@/lib/random-playlist';

const mockPush = jest.fn();
const mockAddMovieView = jest.fn();
const mockAddToWatchlist = jest.fn();
const mockUpdateWatchTime = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/actions/watch/add-movie-view', () => ({
  addMovieView: (...args: unknown[]) => mockAddMovieView(...args),
}));

jest.mock('@/actions/watch/add-to-watchlist', () => ({
  addToWatchlist: (...args: unknown[]) => mockAddToWatchlist(...args),
}));

jest.mock('@/actions/watch/update-watch-time', () => ({
  updateWatchTime: (...args: unknown[]) => mockUpdateWatchTime(...args),
}));

const playlist: RandomPlaylist = {
  title: 'Test Actor',
  returnPath: '/movies',
  movies: [
    {
      id: 'movie-1',
      title: 'First Movie',
      thumbnailUrl: 'first.jpg',
    },
    {
      id: 'movie-2',
      title: 'Second Movie',
      thumbnailUrl: 'second.jpg',
    },
  ],
};

describe('RandomWatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  test('shows an empty state when no temporary playlist exists', async () => {
    render(<RandomWatch />);

    expect(await screen.findByText('Playlist not found')).toBeInTheDocument();
  });

  test('loads and starts the first movie from session storage', async () => {
    sessionStorage.setItem(
      RANDOM_PLAYLIST_STORAGE_KEY,
      JSON.stringify(playlist)
    );

    const { container } = render(<RandomWatch />);

    expect(await screen.findByText('First Movie')).toBeInTheDocument();
    expect(screen.getByText('Random Test Actor:')).toBeInTheDocument();
    expect(container.querySelector('source')).toHaveAttribute(
      'src',
      '/api/video/movie-1'
    );
    await waitFor(() => {
      expect(mockAddMovieView).toHaveBeenCalledWith({ movieId: 'movie-1' });
      expect(mockAddToWatchlist).toHaveBeenCalledWith({ movieId: 'movie-1' });
    });
  });

  test('moves to the next movie without creating a database playlist', async () => {
    sessionStorage.setItem(
      RANDOM_PLAYLIST_STORAGE_KEY,
      JSON.stringify(playlist)
    );

    const { container } = render(<RandomWatch />);
    await screen.findByText('First Movie');

    fireEvent.click(screen.getByRole('button', { name: 'Next video' }));

    expect(await screen.findByText('Second Movie')).toBeInTheDocument();
    expect(container.querySelector('source')).toHaveAttribute(
      'src',
      '/api/video/movie-2'
    );
    expect(mockAddMovieView).toHaveBeenCalledWith({ movieId: 'movie-2' });
  });
});
