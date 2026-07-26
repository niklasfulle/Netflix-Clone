import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();
const mockUseMovie = jest.fn();
const mockUpdateWatchTime = jest.fn();
const mockAddMovieView = jest.fn();
const mockAddToWatchlist = jest.fn();
const mockGetSaveSecond = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ movieId: 'movie1' }),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: jest.fn(() => null) }),
}));
jest.mock('@/hooks/movies/useMovie', () => ({ __esModule: true, default: (...args: any[]) => mockUseMovie(...args) }));
jest.mock('@/actions/watch/update-watch-time', () => ({ updateWatchTime: (...args: any[]) => mockUpdateWatchTime(...args) }));
jest.mock('@/actions/watch/add-movie-view', () => ({ addMovieView: (...args: any[]) => mockAddMovieView(...args) }));
jest.mock('@/actions/watch/add-to-watchlist', () => ({ addToWatchlist: (...args: any[]) => mockAddToWatchlist(...args) }));
jest.mock('@/lib/watch-progress-save', () => ({ getWatchProgressSaveSecond: (...args: any[]) => mockGetSaveSecond(...args) }));
jest.mock('react-icons/fa', () => ({
  FaArrowLeft: ({ onClick }: { onClick?: () => void }) => <button data-testid="back-arrow" onClick={onClick}>back</button>,
}));

import Watch from '../page';

describe('watch page runtime behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the not-found state and navigates home', () => {
    mockUseMovie.mockReturnValue({ data: null });
    render(<Watch />);

    expect(screen.getByText('Not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to home' }));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('restores player state, records views, and saves progress', () => {
    localStorage.setItem('videoVolume', '0.4');
    localStorage.setItem('videoMuted', 'true');
    mockUseMovie.mockReturnValue({ data: {
      id: 'movie1', title: 'Movie One', thumbnailUrl: '/poster.jpg', watchTime: 25,
    } });
    mockGetSaveSecond.mockReturnValueOnce(30).mockReturnValueOnce(null);

    const { container, unmount } = render(<Watch />);
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(mockAddMovieView).toHaveBeenCalledWith({ movieId: 'movie1' });
    expect(mockAddToWatchlist).toHaveBeenCalledWith({ movieId: 'movie1' });
    expect(video.currentTime).toBe(25);
    expect(video.volume).toBe(0.4);
    expect(video.muted).toBe(true);

    video.currentTime = 30.4;
    fireEvent.timeUpdate(video);
    expect(mockUpdateWatchTime).toHaveBeenCalledWith({ movieId: 'movie1', watchTime: 30 });
    fireEvent.timeUpdate(video);

    video.volume = 0.7;
    video.muted = false;
    fireEvent.volumeChange(video);
    expect(localStorage.getItem('videoVolume')).toBe('0.7');
    expect(localStorage.getItem('videoMuted')).toBe('false');

    fireEvent.click(screen.getByTestId('back-arrow'));
    expect(mockPush).toHaveBeenCalledWith('/');
    unmount();
  });
});
