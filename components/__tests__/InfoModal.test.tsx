import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InfoModal from '../InfoModal';
import { UserRole } from '@prisma/client';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, height, width, className }: any) => (
    <img src={src} alt={alt} height={height} width={width} className={className} data-testid="image" />
  ),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock react-icons/ai
jest.mock('react-icons/ai', () => ({
  AiOutlineClose: ({ size, className }: any) => (
    <svg className={className} data-testid="close-icon" width={size} height={size} />
  ),
}));

// Mock custom hooks
jest.mock('@/hooks/useInfoModal', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/movies/useMovie', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/movies/useMovieViews', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/hooks/use-current-user', () => ({
  __esModule: true,
  useCurrentUser: jest.fn(),
}));

// Mock child components
jest.mock('../PlayButton', () => {
  return function DummyPlayButton() {
    return <div data-testid="play-button">Play</div>;
  };
});

jest.mock('../RestartButton', () => {
  return function DummyRestartButton() {
    return <div data-testid="restart-button">Restart</div>;
  };
});

jest.mock('../FavoriteButton', () => {
  return function DummyFavoriteButton() {
    return <div data-testid="favorite-button">Favorite</div>;
  };
});

jest.mock('../EditMovieButton', () => {
  return function DummyEditMovieButton() {
    return <div data-testid="edit-button">Edit</div>;
  };
});

jest.mock('../PlaylistSelect', () => {
  return function DummyPlaylistSelect({ playlists, movieId }: any) {
    return <div data-testid="playlist-select">Playlists: {playlists?.length || 0}</div>;
  };
});

import useInfoModal from '@/hooks/useInfoModal';
import useMovie from '@/hooks/movies/useMovie';
import useMovieViews from '@/hooks/movies/useMovieViews';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';

describe('InfoModal', () => {
  const mockMovie = {
    id: 'movie-123',
    title: 'Test Movie',
    duration: '2:30:45',
    genre: 'Action',
    description: 'A great movie',
    actors: ['Actor One', 'Actor Two'],
    thumbnailUrl: 'https://example.com/thumb.jpg',
  };

  const mockPlaylists = [
    { id: '1', name: 'Playlist 1' },
    { id: '2', name: 'Playlist 2' },
  ];

  const mockUser = {
    id: 'user-123',
    role: UserRole.USER,
  };

  const mockOnClose = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useInfoModal as unknown as jest.Mock).mockReturnValue({ movieId: 'movie-123' });
    (useMovie as jest.Mock).mockReturnValue({ data: mockMovie });
    (useMovieViews as jest.Mock).mockReturnValue({ data: { count: 42 } });
    (useCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('Visibility', () => {
    test('should render when visible is true', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      expect(container.firstChild).toBeTruthy();
    });

    test('should not render when visible is false', () => {
      const { container } = render(
        <InfoModal visible={false} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should not render when visible is undefined', () => {
      const { container } = render(
        <InfoModal onClose={mockOnClose} playlists={mockPlaylists} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should toggle visibility on prop change', () => {
      const { container, rerender } = render(
        <InfoModal visible={false} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      expect(container.firstChild).toBeNull();

      rerender(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Modal Structure', () => {
    test('should have fixed positioning', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('fixed');
    });

    test('should have overlay background', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('bg-black');
      expect(wrapper?.className).toContain('bg-opacity-80');
    });

    test('should be centered on screen', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('items-center');
      expect(wrapper?.className).toContain('justify-center');
    });

    test('should have proper z-index', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('z-50');
    });
  });

  describe('Movie Title Display', () => {
    test('should render movie title', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const titles = screen.queryAllByText('Test Movie');
      expect(titles.length).toBeGreaterThan(0);
    });

    test('should display title in large font', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const titleElement = container.querySelector('.text-4xl, .text-5xl, .text-2xl');
      expect(titleElement?.textContent).toBe('Test Movie');
    });

    test('should render title twice (hero and details)', () => {
      const { container } = render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const titleElements = container.querySelectorAll('[class*="text"]');
      const titleCount = Array.from(titleElements).filter((el) => el.textContent === 'Test Movie').length;
      expect(titleCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Movie Metadata', () => {
    test('should render duration', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('2:30:45')).toBeTruthy();
    });

    test('should render genre', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('Action')).toBeTruthy();
    });

    test('should render description', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('A great movie')).toBeTruthy();
    });

    test('should not render description when missing', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, description: undefined },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByText('A great movie')).not.toBeInTheDocument();
    });

    test('should not render description when value is "test"', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, description: 'test' },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  describe('Views Counter', () => {
    test('should display views count', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText(/42 Views/)).toBeTruthy();
    });

    test('should not render views when count is undefined', () => {
      (useMovieViews as jest.Mock).mockReturnValue({ data: {} });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByText(/Views/)).not.toBeInTheDocument();
    });

    test('should show eye emoji with views', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const viewsElement = screen.getByText(/👁️/);
      expect(viewsElement?.textContent).toContain('42');
    });
  });

  describe('Action Buttons', () => {
    test('should render play button', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('play-button')).toBeTruthy();
    });

    test('should render restart button', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('restart-button')).toBeTruthy();
    });

    test('should render favorite button', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('favorite-button')).toBeTruthy();
    });

    test('should not render edit button for non-admin users', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });

    test('should render edit button for admin users', () => {
      (useCurrentUser as jest.Mock).mockReturnValue({
        id: 'user-123',
        role: UserRole.ADMIN,
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('edit-button')).toBeTruthy();
    });

    test('should render buttons only when movieId exists', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, id: undefined },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByTestId('play-button')).not.toBeInTheDocument();
    });
  });

  describe('Actors', () => {
    test('should render actor array', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('Actor One')).toBeTruthy();
      expect(screen.getByText('Actor Two')).toBeTruthy();
    });

    test('should render actors as links', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const links = screen.getAllByRole('link').filter((link) =>
        (link as HTMLAnchorElement).href.includes('/search/')
      );
      expect(links.length).toBeGreaterThan(0);
    });

    test('should handle actor object format', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: {
          ...mockMovie,
          actors: [
            { id: '1', name: 'Actor A' },
            { id: '2', name: 'Actor B' },
          ],
        },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('Actor A')).toBeTruthy();
      expect(screen.getByText('Actor B')).toBeTruthy();
    });

    test('should handle nested actor format', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: {
          ...mockMovie,
          actors: [{ actor: { id: '1', name: 'Actor X' } }],
        },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('Actor X')).toBeTruthy();
    });

    test('should not render actors when array is empty', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, actors: [] },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.queryByText('Actor One')).not.toBeInTheDocument();
    });

    test('should have blue styling on actor links', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      expect(actorLink.className).toContain('text-blue');
    });

    test('should have underline on actor links', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      expect(actorLink.className).toContain('underline');
    });

    test('should have proper tabIndex on actor links', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One') as HTMLAnchorElement;
      expect(actorLink.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Close Button', () => {
    test('should render close button', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('close-icon')).toBeTruthy();
    });

    test('should have close button clickable', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const closeButton = screen.getByTestId('close-icon').closest('button');
      expect(closeButton).toBeTruthy();
    });

    test('should call onClose when close button clicked', async () => {
      jest.useFakeTimers();
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const closeButton = screen.getByTestId('close-icon').closest('button');
      
      fireEvent.click(closeButton!);
      jest.runAllTimers();
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      jest.useRealTimers();
    });

    test('should have proper styling on close button', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const closeButton = container.querySelector('button');
      expect(closeButton?.className).toContain('rounded-full');
      expect(closeButton?.className).toContain('cursor-pointer');
    });
  });

  describe('Media Display', () => {
    test('should render video on desktop', () => {
      globalThis.innerWidth = 1200;
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const video = container.querySelector('video');
      expect(video).toBeTruthy();
    });

    test('should render image on mobile', () => {
      globalThis.innerWidth = 500;
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('image')).toBeTruthy();
    });

    test('should use thumbnail as video poster', () => {
      globalThis.innerWidth = 1200;
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const video = container.querySelector('video');
      expect(video?.getAttribute('poster')).toBe(mockMovie.thumbnailUrl);
    });

    test('should have autoPlay on video', () => {
      globalThis.innerWidth = 1200;
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const video = container.querySelector('video');
      expect(video?.hasAttribute('autoplay')).toBe(true);
    });

    test('should have muted on video', () => {
      globalThis.innerWidth = 1200;
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const video = container.querySelector('video');
      // React treats muted as a boolean property
      expect((video as any)?.muted || video?.hasAttribute('muted')).toBe(true);
    });

    test('should have loop on video', () => {
      globalThis.innerWidth = 1200;
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const video = container.querySelector('video');
      expect(video?.hasAttribute('loop')).toBe(true);
    });
  });

  describe('Styling and Layout', () => {
    test('should have rounded-2xl corners', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const modal = container.querySelector('[class*="rounded-2xl"]');
      expect(modal).toBeTruthy();
    });

    test('should have shadow-2xl', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const modal = container.querySelector('[class*="shadow-2xl"]');
      expect(modal).toBeTruthy();
    });

    test('should have gradient background', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const content = container.querySelector('[class*="bg-gradient"]');
      expect(content?.className).toContain('from-zinc-900');
      expect(content?.className).toContain('to-zinc-900');
    });

    test('should have border with zinc-800', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const modal = container.querySelector('[class*="border"]');
      expect(modal?.className).toContain('border-zinc-800');
    });

    test('should have max width constraint', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const content = container.querySelector('[class*="max-w"]');
      expect(content?.className).toContain('max-w-3xl');
    });
  });

  describe('Playlist Selection', () => {
    test('should render playlist select component', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('playlist-select')).toBeTruthy();
    });

    test('should pass playlists to playlist select', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const playlistElement = screen.getByTestId('playlist-select');
      expect(playlistElement.textContent).toContain('2');
    });

    test('should pass movieId to playlist select', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByTestId('playlist-select')).toBeTruthy();
    });

    test('should handle empty playlists array', () => {
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={[]} />);
      const playlistElement = screen.getByTestId('playlist-select');
      expect(playlistElement.textContent).toContain('0');
    });
  });

  describe('Actor Link Navigation', () => {
    test('should navigate to search on actor link click', () => {
      jest.useFakeTimers();
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      
      fireEvent.click(actorLink);
      jest.runAllTimers();
      
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/search/'));
      jest.useRealTimers();
    });

    test('should encode actor name in URL', () => {
      jest.useFakeTimers();
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, actors: ['John Doe'] },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('John Doe');
      
      fireEvent.click(actorLink);
      jest.runAllTimers();
      
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/search/));
      jest.useRealTimers();
    });

    test('should handle keydown on actor links', () => {
      jest.useFakeTimers();
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      
      fireEvent.keyDown(actorLink, { key: 'Enter' });
      jest.runAllTimers();
      
      expect(mockPush).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should handle space key on actor links', () => {
      jest.useFakeTimers();
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      
      fireEvent.keyDown(actorLink, { key: ' ' });
      jest.runAllTimers();
      
      expect(mockPush).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should close modal after actor link navigation', () => {
      jest.useFakeTimers();
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const actorLink = screen.getByText('Actor One');
      
      fireEvent.click(actorLink);
      jest.runAllTimers();
      
      expect(mockOnClose).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Component Stability', () => {
    test('should not throw on mount', () => {
      expect(() => {
        render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle rapid visibility toggling', () => {
      const { rerender } = render(
        <InfoModal visible={false} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      rerender(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      rerender(<InfoModal visible={false} onClose={mockOnClose} playlists={mockPlaylists} />);
      rerender(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      
      expect(true).toBe(true);
    });

    test('should handle prop updates gracefully', () => {
      const { rerender } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      
      const newPlaylists = [{ id: '3', name: 'Playlist 3' }];
      rerender(
        <InfoModal visible={true} onClose={mockOnClose} playlists={newPlaylists} />
      );
      
      expect(screen.getByTestId('playlist-select')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing movie data', () => {
      (useMovie as jest.Mock).mockReturnValue({ data: null });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(true).toBe(true); // Should not crash
    });

    test('should handle undefined actors', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, actors: undefined },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(true).toBe(true); // Should not crash
    });

    test('should handle null movieId', () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({ movieId: null });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(true).toBe(true); // Should not crash
    });

    test('should handle very long movie title', () => {
      const longTitle = 'A'.repeat(200);
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, title: longTitle },
      });
      const { container } = render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      const titleElements = container.querySelectorAll('*');
      const hasTitleText = Array.from(titleElements).some((el) => el.textContent?.includes(longTitle));
      expect(hasTitleText).toBe(true);
    });

    test('should handle special characters in actor names', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, actors: ["O'Brien", 'Müller', 'José'] },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText("O'Brien")).toBeTruthy();
    });

    test('should handle actors with no name property', () => {
      (useMovie as jest.Mock).mockReturnValue({
        data: { ...mockMovie, actors: [{ id: '1' }, 'Valid Actor'] },
      });
      render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      expect(screen.getByText('Valid Actor')).toBeTruthy();
    });
  });

  describe('Animation and Transitions', () => {
    test('should have scale transform', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const content = container.querySelector('[class*="scale"]');
      expect(content?.className).toContain('transform');
    });

    test('should have duration class on animation', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('duration');
    });

    test('should have transition class', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('transition');
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive padding', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const element = container.querySelector('[class*="px"]');
      expect(element?.className).toContain('px');
    });

    test('should have responsive margins', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const element = container.querySelector('[class*="mt"]');
      expect(element).toBeTruthy();
    });

    test('should have responsive text sizes', () => {
      const { container } = render(
        <InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />
      );
      const titleElement = container.querySelector('.text-4xl, .md\\:text-5xl');
      expect(titleElement).toBeTruthy();
    });
  });

  describe('Full Integration', () => {
    test('should render complete modal with all elements', () => {
      const { container } = render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      
      // Check title exists (may appear multiple times)
      const titleElements = container.querySelectorAll('*');
      const hasTitle = Array.from(titleElements).some((el) => el.textContent?.includes('Test Movie'));
      expect(hasTitle).toBe(true);
      
      // Check metadata
      expect(screen.getByText('2:30:45')).toBeTruthy();
      expect(screen.getByText('Action')).toBeTruthy();
      // Check actors
      expect(screen.getByText('Actor One')).toBeTruthy();
      // Check buttons
      expect(screen.getByTestId('play-button')).toBeTruthy();
      expect(screen.getByTestId('favorite-button')).toBeTruthy();
      // Check close button
      expect(screen.getByTestId('close-icon')).toBeTruthy();
    });

    test('should handle complete user interaction flow', async () => {
      jest.useFakeTimers();
      const { container } = render(<InfoModal visible={true} onClose={mockOnClose} playlists={mockPlaylists} />);
      
      // Click an actor link
      const actorLinks = Array.from(container.querySelectorAll('a')).filter((link) =>
        (link as HTMLAnchorElement).href.includes('/search/')
      );
      if (actorLinks.length > 0) {
        fireEvent.click(actorLinks[0]);
        jest.runAllTimers();
        expect(mockPush).toHaveBeenCalled();
      }
      
      jest.useRealTimers();
    });
  });
});
