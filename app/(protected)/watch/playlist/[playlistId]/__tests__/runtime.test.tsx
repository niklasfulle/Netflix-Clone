import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();
const mockUsePlaylist = jest.fn();
const mockUpdateWatchTime = jest.fn();
const mockAddMovieView = jest.fn();
const mockAddToWatchlist = jest.fn();
const mockGetSaveSecond = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ playlistId: 'playlist1' }),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/hooks/playlists/usePlaylist', () => ({ __esModule: true, default: (...args: any[]) => mockUsePlaylist(...args) }));
jest.mock('@/actions/watch/update-watch-time', () => ({ updateWatchTime: (...args: any[]) => mockUpdateWatchTime(...args) }));
jest.mock('@/actions/watch/add-movie-view', () => ({ addMovieView: (...args: any[]) => mockAddMovieView(...args) }));
jest.mock('@/actions/watch/add-to-watchlist', () => ({ addToWatchlist: (...args: any[]) => mockAddToWatchlist(...args) }));
jest.mock('@/lib/watch-progress-save', () => ({ getWatchProgressSaveSecond: (...args: any[]) => mockGetSaveSecond(...args) }));
jest.mock('react-icons/fa', () => ({
  FaArrowLeft: ({ onClick }: { onClick?: () => void }) => <button data-testid="left-arrow" onClick={onClick}>left</button>,
  FaArrowRight: ({ onClick }: { onClick?: () => void }) => <button data-testid="right-arrow" onClick={onClick}>right</button>,
}));

import WatchPlaylist from '../page';

const playlist = {
  id: 'playlist1',
  movies: [
    { id: 'movie1', title: 'One', thumbnailUrl: '/one.jpg' },
    { id: 'movie2', title: 'Two', thumbnailUrl: '/two.jpg' },
    { id: 'movie3', title: 'Three', thumbnailUrl: '/three.jpg' },
  ],
};

describe('playlist watch page runtime behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlaylist.mockReturnValue({ data: playlist });
  });

  it('navigates through playlist movies and saves progress', () => {
    mockGetSaveSecond.mockReturnValue(10);
    const { container } = render(<WatchPlaylist />);
    let video = container.querySelector('video') as HTMLVideoElement;

    expect(mockAddMovieView).toHaveBeenCalledWith({ movieId: 'movie1' });
    expect(screen.getByText('One')).toBeInTheDocument();
    video.currentTime = 9.7;
    fireEvent.timeUpdate(video);
    expect(mockUpdateWatchTime).toHaveBeenCalledWith({ movieId: 'movie1', watchTime: 10 });

    fireEvent.click(screen.getAllByTestId('right-arrow')[0]);
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(mockAddMovieView).toHaveBeenCalledWith({ movieId: 'movie2' });

    fireEvent.click(screen.getAllByTestId('right-arrow')[0]);
    expect(screen.getByText('Three')).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('left-arrow').at(-1)!);
    expect(screen.getByText('Two')).toBeInTheDocument();

    video = container.querySelector('video') as HTMLVideoElement;
    fireEvent.ended(video);
    expect(mockUpdateWatchTime).toHaveBeenCalled();

    fireEvent.click(screen.getAllByTestId('left-arrow')[0]);
    expect(mockPush).toHaveBeenCalledWith('/playlists');
  });

  it('renders safely when the playlist has no movies', () => {
    mockUsePlaylist.mockReturnValue({ data: { id: 'empty', movies: [] } });
    const { container } = render(<WatchPlaylist />);
    expect(container.querySelector('video')).toBeNull();
  });
});
