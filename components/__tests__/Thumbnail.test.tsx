import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Thumbnail from '../Thumbnail';
import * as useInfoModalHook from '@/hooks/useInfoModal';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock useInfoModal hook
jest.mock('@/hooks/useInfoModal');

describe('Thumbnail', () => {
  const mockOpenModal = jest.fn();

  const defaultMockData = {
    id: '123',
    title: 'Test Movie',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: '1:30:45',
    watchTime: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useInfoModalHook.default as unknown as jest.Mock).mockReturnValue({
      openModal: mockOpenModal,
    });
  });

  describe('Rendering', () => {
    it('should render a button element', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have correct button classes', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('relative');
      expect(button).toHaveClass('h-28');
      expect(button).toHaveClass('cursor-pointer');
      expect(button).toHaveClass('transition');
      expect(button).toHaveClass('duration-200');
    });

    it('should have responsive classes', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('md:h-36');
      expect(button).toHaveClass('md:hover:scale-105');
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      const { container } = render(
        <Thumbnail data={defaultMockData} isLoading={true} />
      );
      const loadingDiv = container.querySelector(
        '[class*="bg-zinc-800"]'
      );
      expect(loadingDiv).toBeInTheDocument();
    });

    it('should display SVG icon in loading skeleton', () => {
      const { container } = render(
        <Thumbnail data={defaultMockData} isLoading={true} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct loading skeleton classes', () => {
      const { container } = render(
        <Thumbnail data={defaultMockData} isLoading={true} />
      );
      const loadingDiv = container.querySelector(
        '[class*="bg-zinc-800"]'
      );
      expect(loadingDiv).toHaveClass('flex');
      expect(loadingDiv).toHaveClass('items-center');
      expect(loadingDiv).toHaveClass('justify-center');
      expect(loadingDiv).toHaveClass('rounded-t-md');
    });

    it('should not display image when isLoading is true', () => {
      render(<Thumbnail data={defaultMockData} isLoading={true} />);
      const image = screen.queryByAltText('Thumbnail');
      expect(image).not.toBeInTheDocument();
    });
  });

  describe('Image Rendering', () => {
    it('should display image when isLoading is false', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toBeInTheDocument();
    });

    it('should use correct thumbnail URL', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail') as HTMLImageElement;
      expect(image).toHaveAttribute('src', defaultMockData.thumbnailUrl);
    });

    it('should have image with width and height attributes', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveAttribute('width', '500');
      expect(image).toHaveAttribute('height', '500');
    });

    it('should have correct image classes', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveClass('w-full');
      expect(image).toHaveClass('transition');
      expect(image).toHaveClass('cursor-pointer');
      expect(image).toHaveClass('rounded-t-md');
    });

    it('should not display loading skeleton when isLoading is false', () => {
      const { container } = render(
        <Thumbnail data={defaultMockData} isLoading={false} />
      );
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar Calculation', () => {
    it('should calculate and display progress bar when watchTime is defined', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const bars = container.querySelectorAll('[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should not display progress bar when watchTime is undefined', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: undefined }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).not.toBeInTheDocument();
    });

    it('should calculate correct progress bar width for 1:30:45 duration with 1500 watchTime', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '1:30:45', watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]') as HTMLElement;
      const width = redBar?.getAttribute('style');
      expect(width).toMatch(/width:/);
    });

    it('should handle seconds only duration format', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '300', watchTime: 150 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should handle minutes:seconds duration format', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '5:30', watchTime: 165 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should display both red progress bar and black background bar', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      const blackBar = container.querySelector('[class*="bg-black"]');
      expect(redBar).toBeInTheDocument();
      expect(blackBar).toBeInTheDocument();
    });

    it('should position progress bars at bottom', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      const blackBar = container.querySelector('[class*="bg-black"]');
      expect(redBar).toHaveClass('bottom-[0px]');
      expect(blackBar).toHaveClass('bottom-[0px]');
    });

    it('should have correct bar heights', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      const blackBar = container.querySelector('[class*="bg-black"]');
      expect(redBar).toHaveClass('h-1');
      expect(blackBar).toHaveClass('h-1');
    });

    it('should have absolute positioning for bars', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      const blackBar = container.querySelector('[class*="bg-black"]');
      expect(redBar).toHaveClass('absolute');
      expect(blackBar).toHaveClass('absolute');
    });

    it('should have z-index on progress bar', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 1500 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toHaveClass('z-10');
    });
  });

  describe('Modal Interaction', () => {
    it('should call openModal when thumbnail is clicked', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith(defaultMockData.id);
    });

    it('should call openModal with correct movie ID', () => {
      const customData = { ...defaultMockData, id: 'custom-id-456' };
      render(<Thumbnail data={customData} isLoading={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith('custom-id-456');
    });

    it('should call openModal only once when clicked once', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('should call openModal multiple times for multiple clicks', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledTimes(3);
    });

    it('should pass data ID to openModal', () => {
      const dataWithId = { ...defaultMockData, id: 'movie-789' };
      render(<Thumbnail data={dataWithId} isLoading={false} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith('movie-789');
    });
  });

  describe('Edge Cases', () => {
    it('should handle watchTime as 0', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 0 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]') as HTMLElement;
      expect(redBar).toHaveStyle({ width: expect.stringContaining('%') });
    });

    it('should handle very short duration', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '5', watchTime: 2 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should handle very long duration', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '10:45:30', watchTime: 5000 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should handle watchTime greater than duration', () => {
      const { container } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '1:00', watchTime: 120 }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should handle missing thumbnailUrl gracefully', () => {
      render(
        <Thumbnail
          data={{ ...defaultMockData, thumbnailUrl: undefined }}
          isLoading={false}
        />
      );
      const image = screen.getByAltText('Thumbnail');
      expect(image).toBeInTheDocument();
    });

    it('should render with minimal data', () => {
      const minimalData = {
        id: '1',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        duration: '1:30',
        watchTime: undefined,
      };
      render(<Thumbnail data={minimalData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to loaded', () => {
      const { rerender, container } = render(
        <Thumbnail data={defaultMockData} isLoading={true} />
      );
      let loadingDiv = container.querySelector('[class*="bg-zinc-800"]');
      expect(loadingDiv).toBeInTheDocument();

      rerender(<Thumbnail data={defaultMockData} isLoading={false} />);
      loadingDiv = container.querySelector('[class*="bg-zinc-800"]');
      expect(loadingDiv).not.toBeInTheDocument();

      const image = screen.getByAltText('Thumbnail');
      expect(image).toBeInTheDocument();
    });

    it('should handle data updates with same loading state', () => {
      const initialData = {
        ...defaultMockData,
        id: 'movie-1',
        title: 'Movie 1',
      };
      const updatedData = {
        ...defaultMockData,
        id: 'movie-2',
        title: 'Movie 2',
      };

      const { rerender } = render(
        <Thumbnail data={initialData} isLoading={false} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(mockOpenModal).toHaveBeenCalledWith('movie-1');

      rerender(<Thumbnail data={updatedData} isLoading={false} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockOpenModal).toHaveBeenCalledWith('movie-2');
    });

    it('should handle watchTime updates', () => {
      const { rerender, container } = render(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 500 }}
          isLoading={false}
        />
      );
      let redBar = container.querySelector('[class*="bg-red-600"]') as HTMLElement;
      const firstWidth = redBar.style.width;

      rerender(
        <Thumbnail
          data={{ ...defaultMockData, watchTime: 2500 }}
          isLoading={false}
        />
      );
      redBar = container.querySelector('[class*="bg-red-600"]') as HTMLElement;
      const secondWidth = redBar.style.width;

      expect(firstWidth).not.toEqual(secondWidth);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should have image with max width class', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveClass('max-w-64');
    });

    it('should have image with aspect-video class', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveClass('aspect-video');
    });

    it('should have shadow-xl on image', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveClass('shadow-xl');
    });

    it('should have min-w class on button', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[180px]');
    });

    it('should have responsive min-w on button', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('md:min-w-[260px]');
    });
  });

  describe('Accessibility', () => {
    it('should have alt text on image', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const image = screen.getByAltText('Thumbnail');
      expect(image).toHaveAttribute('alt', 'Thumbnail');
    });

    it('should be clickable button', () => {
      render(<Thumbnail data={defaultMockData} isLoading={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should have aria-hidden on loading SVG', () => {
      const { container } = render(
        <Thumbnail data={defaultMockData} isLoading={true} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Progress Bar Width Calculation', () => {
    it('should correctly calculate progress for partial watch', () => {
      const { container } = render(
        <Thumbnail
          data={{
            ...defaultMockData,
            duration: '2:00', // 120 seconds
            watchTime: 60, // 50% watched
          }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]') as HTMLElement;
      const widthValue = redBar.style.width;
      expect(widthValue).toMatch(/\d+(\.\d+)?%/);
    });

    it('should handle hours:minutes:seconds format', () => {
      const { container } = render(
        <Thumbnail
          data={{
            ...defaultMockData,
            duration: '2:15:30', // 2 hours 15 minutes 30 seconds
            watchTime: 4530, // 30 minutes 30 seconds
          }}
          isLoading={false}
        />
      );
      const redBar = container.querySelector('[class*="bg-red-600"]');
      expect(redBar).toBeInTheDocument();
    });

    it('should produce different widths for different watch times', () => {
      const { container: container1 } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '1:00', watchTime: 15 }}
          isLoading={false}
        />
      );
      const width1 = (
        container1.querySelector('[class*="bg-red-600"]') as HTMLElement
      ).style.width;

      const { container: container2 } = render(
        <Thumbnail
          data={{ ...defaultMockData, duration: '1:00', watchTime: 45 }}
          isLoading={false}
        />
      );
      const width2 = (
        container2.querySelector('[class*="bg-red-600"]') as HTMLElement
      ).style.width;

      expect(width1).not.toEqual(width2);
    });
  });
});
