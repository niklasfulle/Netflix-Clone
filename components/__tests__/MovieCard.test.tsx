import { render, screen, fireEvent } from '@testing-library/react';
import MovieCard from '../MovieCard';
import useInfoModal from '@/hooks/useInfoModal';
import { useRouter } from 'next/navigation';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className, onClick }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-testid={`image-${alt}`}
      onClick={onClick}
    />
  ),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock react-device-detect
jest.mock('react-device-detect', () => ({
  isMobile: false,
}));

// Mock react-icons/fa
jest.mock('react-icons/fa', () => ({
  FaChevronDown: ({ className, size }: any) => (
    <svg
      data-testid="chevron-down-icon"
      width={size}
      height={size}
      className={className}
    />
  ),
}));

// Mock useInfoModal
jest.mock('@/hooks/useInfoModal', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock child components
jest.mock('../MovieCardPlayButton', () => {
  return function DummyMovieCardPlayButton() {
    return <div data-testid="movie-card-play-button">Play</div>;
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

describe('MovieCard', () => {
  const mockOpenModal = jest.fn();
  const mockPush = jest.fn();

  const mockMovieData = {
    id: 'movie-123',
    title: 'Test Movie',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: '2:30:45',
    genre: 'Action',
    watchTime: 5400,
    actors: ['Actor One', 'Actor Two'],
    actor: 'Main Actor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useInfoModal as unknown as jest.Mock).mockReturnValue({ openModal: mockOpenModal });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('Rendering', () => {
    test('should render without crashing', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should render with button role', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have tabIndex 0', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].getAttribute('tabIndex')).toBe('0');
    });

    test('should have group class for hover', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toMatch(/group/);
    });

    test('should have bg-zinc-900', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toMatch(/bg-zinc-900/);
    });

    test('should have cursor-pointer', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toMatch(/cursor-pointer/);
    });

    test('should have relative position', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toMatch(/relative/);
    });
  });

  describe('Loading State', () => {
    test('should render SVG when isLoading is true', () => {
      render(<MovieCard data={mockMovieData} isLoading={true} />);
      const svg = screen.getByRole('img');
      expect(svg).toBeTruthy();
    });

    test('should not render image when isLoading is true', () => {
      render(<MovieCard data={mockMovieData} isLoading={true} />);
      expect(screen.queryByTestId('image-Thumbnail')).not.toBeInTheDocument();
    });

    test('should render image when isLoading is false', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('image-Thumbnail')).toBeTruthy();
    });

    test('should have bg-zinc-800 loading container', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={true} />
      );
      const loadingDiv = container.querySelector('.bg-zinc-800');
      expect(loadingDiv).toBeTruthy();
    });
  });

  describe('Image Display', () => {
    test('should render main thumbnail with correct src', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail') as HTMLImageElement;
      expect(image.src).toContain(mockMovieData.thumbnailUrl);
    });

    test('should render thumbnail with correct alt', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail');
      expect(image.getAttribute('alt')).toBe('Thumbnail');
    });

    test('should render hover image', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('image-Thumbnail2')).toBeTruthy();
    });

    test('should have both images with same src', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const mainImage = screen.getByTestId('image-Thumbnail') as HTMLImageElement;
      const hoverImage = screen.getByTestId('image-Thumbnail2') as HTMLImageElement;
      expect(mainImage.src).toBe(hoverImage.src);
    });

    test('should have correct image dimensions', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail');
      expect(image.getAttribute('width')).toBe('1920');
      expect(image.getAttribute('height')).toBe('1080');
    });

    test('should have object-cover class', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail');
      expect(image.className).toMatch(/object-cover/);
    });
  });

  describe('Progress Bar', () => {
    test('should render progress bar with watchTime', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const progressBar = container.querySelector('.bg-red-600');
      expect(progressBar).toBeTruthy();
    });

    test('should not render progress bar without watchTime', () => {
      const data = { ...mockMovieData, watchTime: undefined };
      const { container } = render(
        <MovieCard data={data} isLoading={false} />
      );
      const progressBar = container.querySelector('.bg-red-600');
      expect(progressBar).not.toBeInTheDocument();
    });

    test('should have black background bar', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const bgBar = container.querySelector('.h-1.bg-black');
      expect(bgBar).toBeTruthy();
    });

    test('should calculate progress width', () => {
      const data = {
        ...mockMovieData,
        duration: '1:00',
        watchTime: 30,
      };
      const { container } = render(
        <MovieCard data={data} isLoading={false} />
      );
      const progressBar = container.querySelector('.bg-red-600') as HTMLElement;
      expect(progressBar.style.width).toMatch(/%/);
    });

    test('should have zero width for zero watchTime', () => {
      const data = {
        ...mockMovieData,
        watchTime: 0,
      };
      const { container } = render(
        <MovieCard data={data} isLoading={false} />
      );
      const progressBar = container.querySelector('.bg-red-600') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
    });
  });

  describe('Title Display', () => {
    test('should render title', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const titles = screen.getAllByText(mockMovieData.title);
      expect(titles.length).toBeGreaterThan(0);
    });

    test('should have multiple title instances', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const titles = screen.getAllByText(mockMovieData.title);
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Duration and Genre', () => {
    test('should render duration', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByText(mockMovieData.duration)).toBeTruthy();
    });

    test('should render genre', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByText(mockMovieData.genre)).toBeTruthy();
    });

    test('should have white text for duration', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const duration = screen.getByText(mockMovieData.duration);
      expect(duration.className).toMatch(/text-white/);
    });
  });

  describe('Actors', () => {
    test('should render actor array items', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByText('Actor One')).toBeTruthy();
      expect(screen.getByText('Actor Two')).toBeTruthy();
    });

    test('should render actors as links', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const links = screen.getAllByRole('link').filter((l) =>
        (l as HTMLAnchorElement).href.includes('/search/')
      );
      expect(links.length).toBeGreaterThan(0);
    });

    test('should have underline on actor links', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      expect(actorLink.className).toMatch(/underline/);
    });

    test('should have cursor-pointer on actor links', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      expect(actorLink.className).toMatch(/cursor-pointer/);
    });

    test('should handle object actor format', () => {
      const data = {
        ...mockMovieData,
        actors: [
          { id: '1', name: 'Actor A' },
          { id: '2', name: 'Actor B' },
        ],
      };
      render(<MovieCard data={data} isLoading={false} />);
      expect(screen.getByText('Actor A')).toBeTruthy();
      expect(screen.getByText('Actor B')).toBeTruthy();
    });

    test('should handle nested actor format', () => {
      const data = {
        ...mockMovieData,
        actors: [{ actor: { id: '1', name: 'Actor X' } }],
      };
      render(<MovieCard data={data} isLoading={false} />);
      expect(screen.getByText('Actor X')).toBeTruthy();
    });

    test('should render single actor string', () => {
      const data = { ...mockMovieData, actor: 'Single Actor', actors: [] };
      render(<MovieCard data={data} isLoading={false} />);
      const actorElements = screen.queryAllByText('Single Actor');
      expect(actorElements.length).toBeGreaterThan(0);
    });
  });

  describe('Action Buttons', () => {
    test('should render play button', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('movie-card-play-button')).toBeTruthy();
    });

    test('should render restart button', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('restart-button')).toBeTruthy();
    });

    test('should render favorite button', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('favorite-button')).toBeTruthy();
    });

    test('should render info button', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should render chevron icon', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      expect(screen.getByTestId('chevron-down-icon')).toBeTruthy();
    });

    test('should have info button with rounded-full', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/rounded-full/);
    });

    test('should have info button with border-white', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/border-white/);
    });

    test('should open modal on info button click', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(mockOpenModal).toHaveBeenCalledWith(mockMovieData.id);
    });
  });

  describe('Actor Link Interactions', () => {
    test('should call push on actor link click', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      fireEvent.click(actorLink);
      expect(mockPush).toHaveBeenCalled();
    });

    test('should call push on Enter key', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      fireEvent.keyDown(actorLink, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalled();
    });

    test('should call push on Space key', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      fireEvent.keyDown(actorLink, { key: ' ' });
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Hover Image Click', () => {
    test('should open modal on hover image click', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const hoverImage = screen.getByTestId('image-Thumbnail2');
      fireEvent.click(hoverImage);
      expect(mockOpenModal).toHaveBeenCalledWith(mockMovieData.id);
    });
  });

  describe('Details Section', () => {
    test('should have details section with bg-zinc-800', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const details = container.querySelector('.bg-zinc-800');
      expect(details).toBeTruthy();
    });

    test('should have flex layout in details', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const flexDiv = container.querySelector('.flex.flex-row');
      expect(flexDiv).toBeTruthy();
    });

    test('should have rounded-b-md on details', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const roundedDiv = container.querySelector('.rounded-b-md');
      expect(roundedDiv).toBeTruthy();
    });

    test('should have max-h-52 constraint', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const maxHeightDiv = container.querySelector('.max-h-52');
      expect(maxHeightDiv).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have button role', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have alt text on images', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toBeTruthy();
    });

    test('should have actor links accessible', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('should have tabIndex 0 on actors', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const actorLink = screen.getByText('Actor One');
      expect(actorLink.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Props Handling', () => {
    test('should handle full data object', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const titleElements = screen.queryAllByText(mockMovieData.title);
      expect(titleElements.length).toBeGreaterThan(0);
    });

    test('should handle minimal data', () => {
      const minimalData = {
        id: 'test',
        title: 'Test',
        thumbnailUrl: 'http://test.jpg',
        duration: '1:00',
        genre: 'Test',
        watchTime: 0,
      };
      render(<MovieCard data={minimalData} isLoading={false} />);
      const titleElements = screen.queryAllByText('Test');
      expect(titleElements.length).toBeGreaterThan(0);
    });

    test('should handle empty actors array', () => {
      const data = { ...mockMovieData, actors: [] };
      render(<MovieCard data={data} isLoading={false} />);
      const titleElements = screen.queryAllByText(mockMovieData.title);
      expect(titleElements.length).toBeGreaterThan(0);
    });

    test('should handle isLoading true', () => {
      render(
        <MovieCard data={mockMovieData} isLoading={true} />
      );
      const svg = screen.getByRole('img');
      expect(svg).toBeTruthy();
    });

    test('should handle isLoading false', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail');
      expect(image).toBeTruthy();
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple cards', () => {
      const data1 = { ...mockMovieData, id: 'm1' };
      const data2 = { ...mockMovieData, id: 'm2' };
      const data3 = { ...mockMovieData, id: 'm3' };
      const { container } = render(
        <>
          <MovieCard data={data1} isLoading={false} />
          <MovieCard data={data2} isLoading={false} />
          <MovieCard data={data3} isLoading={false} />
        </>
      );
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards.length).toBe(3);
    });

    test('should handle different data per card', () => {
      const data1 = { ...mockMovieData, id: 'm1', title: 'Movie 1' };
      const data2 = { ...mockMovieData, id: 'm2', title: 'Movie 2' };
      render(
        <>
          <MovieCard data={data1} isLoading={false} />
          <MovieCard data={data2} isLoading={false} />
        </>
      );
      const movie1Elements = screen.queryAllByText('Movie 1');
      const movie2Elements = screen.queryAllByText('Movie 2');
      expect(movie1Elements.length).toBeGreaterThan(0);
      expect(movie2Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle long title', () => {
      const data = { ...mockMovieData, title: 'A'.repeat(200) };
      render(<MovieCard data={data} isLoading={false} />);
      const titleElements = screen.queryAllByText((content) => content === 'A'.repeat(200));
      expect(titleElements.length).toBeGreaterThan(0);
    });

    test('should handle special characters in title', () => {
      const data = { ...mockMovieData, title: "Movie & The's \"Sequel\"" };
      render(<MovieCard data={data} isLoading={false} />);
      const titleElements = screen.queryAllByText((content) => content.includes('Movie') && content.includes('Sequel'));
      expect(titleElements.length).toBeGreaterThan(0);
    });

    test('should handle special characters in actors', () => {
      const data = { ...mockMovieData, actors: ["O'Brien", 'Müller'] };
      render(<MovieCard data={data} isLoading={false} />);
      const actorElements = screen.queryAllByText("O'Brien");
      expect(actorElements.length).toBeGreaterThan(0);
    });
  });

  describe('Component Stability', () => {
    test('should render consistently', () => {
      const { rerender } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const first = screen.getAllByText(mockMovieData.title).length;
      rerender(<MovieCard data={mockMovieData} isLoading={false} />);
      const second = screen.getAllByText(mockMovieData.title).length;
      expect(first).toBe(second);
    });

    test('should handle prop updates', () => {
      const { rerender } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const titleElements1 = screen.queryAllByText(mockMovieData.title);
      expect(titleElements1.length).toBeGreaterThan(0);
      const updated = { ...mockMovieData, title: 'Updated' };
      rerender(<MovieCard data={updated} isLoading={false} />);
      const titleElements2 = screen.queryAllByText('Updated');
      expect(titleElements2.length).toBeGreaterThan(0);
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Hover Effects', () => {
    test('should have opacity-0 overlay', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const overlay = container.querySelector('.opacity-0');
      expect(overlay).toBeTruthy();
    });

    test('should have scale-0 animation', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const scale = container.querySelector('.scale-0');
      expect(scale).toBeTruthy();
    });

    test('should have transition on image', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const image = screen.getByTestId('image-Thumbnail');
      expect(image.className).toMatch(/transition/);
    });
  });

  describe('Container Structure', () => {
    test('should have relative positioned child', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const relative = container.querySelector('.relative');
      expect(relative).toBeTruthy();
    });

    test('should have image inside relative div', () => {
      const { container } = render(
        <MovieCard data={mockMovieData} isLoading={false} />
      );
      const relative = container.querySelector('.relative');
      const image = relative?.querySelector('img');
      expect(image).toBeTruthy();
    });
  });

  describe('Keyboard Events', () => {
    test('should handle key press on card', () => {
      render(<MovieCard data={mockMovieData} isLoading={false} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.keyDown(buttons[0], { key: 'Enter' });
      // Should not crash
      expect(buttons[0]).toBeTruthy();
    });
  });
});
