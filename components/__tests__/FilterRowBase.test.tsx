'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterRowBase from '../FilterRowBase';
import { Movie } from '@prisma/client';

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaChevronLeft: ({ onClick, ...props }: any) => (
    <button data-testid="chevron-left" onClick={onClick} {...props}>
      Left
    </button>
  ),
  FaChevronRight: ({ onClick, ...props }: any) => (
    <button data-testid="chevron-right" onClick={onClick} {...props}>
      Right
    </button>
  ),
}));

// Mock Thumbnail component
jest.mock('@/components/Thumbnail', () => {
  return function MockThumbnail({ data, isLoading }: any) {
    return (
      <div data-testid={`thumbnail-${data.id}`} data-loading={isLoading}>
        {data.title}
      </div>
    );
  };
});

// Mock lodash isEmpty
jest.mock('lodash', () => ({
  isEmpty: (arr: any) => !arr || arr.length === 0,
}));

// Mock scrollTo on HTMLElement
Element.prototype.scrollTo = jest.fn();

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Movie 1',
    description: 'Description 1',
    videoUrl: 'url1',
    thumbnailUrl: 'thumb1',
    type: 'movie',
    genre: 'action',
    duration: '120',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Movie 2',
    description: 'Description 2',
    videoUrl: 'url2',
    thumbnailUrl: 'thumb2',
    type: 'movie',
    genre: 'drama',
    duration: '130',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Movie 3',
    description: 'Description 3',
    videoUrl: 'url3',
    thumbnailUrl: 'thumb3',
    type: 'movie',
    genre: 'comedy',
    duration: '140',
    createdAt: new Date(),
  },
];

describe('FilterRowBase', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      render(
        <FilterRowBase title="Test Row" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('Test Row')).toBeInTheDocument();
    });

    test('should render title prop', () => {
      render(
        <FilterRowBase title="Action Movies" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('Action Movies')).toBeInTheDocument();
    });

    test('should render container div', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild;
      expect(mainDiv).toBeInTheDocument();
    });

    test('should render multiple movies', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });

    test('should render with empty movies array', () => {
      render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should render title with proper styling', () => {
      render(
        <FilterRowBase title="Test Title" movies={mockMovies} isLoading={false} />
      );
      const titleElement = screen.getByText('Test Title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement.className).toMatch(/text-white/);
    });
  });

  describe('Props Handling', () => {
    test('should accept title prop', () => {
      render(
        <FilterRowBase title="My Movies" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('My Movies')).toBeInTheDocument();
    });

    test('should accept movies array prop', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });

    test('should accept isLoading prop', () => {
      const { rerender, container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={true} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should handle single movie', () => {
      render(
        <FilterRowBase
          title="Single Movie"
          movies={[mockMovies[0]]}
          isLoading={false}
        />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.queryByTestId('thumbnail-2')).not.toBeInTheDocument();
    });

    test('should pass isLoading to thumbnails', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={true} />
      );
      const thumbnail = screen.getByTestId('thumbnail-1');
      expect(thumbnail.dataset.loading).toBe('true');
    });
  });

  describe('Title Display', () => {
    test('should display custom title', () => {
      render(
        <FilterRowBase title="Custom Title" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    test('should have text-white class on title', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const title = screen.getByText('Test');
      expect(title.className).toMatch(/text-white/);
    });

    test('should have font-semibold on title', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const title = screen.getByText('Test');
      expect(title.className).toMatch(/font-semibold/);
    });

    test('should have responsive text sizing on title', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const title = screen.getByText('Test');
      expect(title.className).toMatch(/md:text-xl/);
      expect(title.className).toMatch(/lg:text-2xl/);
    });
  });

  describe('Movies List Rendering', () => {
    test('should render all movies as thumbnails', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      mockMovies.forEach(movie => {
        expect(screen.getByTestId(`thumbnail-${movie.id}`)).toBeInTheDocument();
      });
    });

    test('should pass correct data to thumbnail', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const thumbnail1 = screen.getByTestId('thumbnail-1');
      expect(thumbnail1.textContent).toBe('Movie 1');
    });

    test('should render movies in correct order', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const thumbnails = [
        screen.getByTestId('thumbnail-1'),
        screen.getByTestId('thumbnail-2'),
        screen.getByTestId('thumbnail-3'),
      ];
      expect(thumbnails[0].textContent).toBe('Movie 1');
      expect(thumbnails[1].textContent).toBe('Movie 2');
      expect(thumbnails[2].textContent).toBe('Movie 3');
    });

    test('should not render movies section when empty', () => {
      render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(screen.queryByTestId('thumbnail-1')).not.toBeInTheDocument();
    });

    test('should render loading state on thumbnails', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={true} />
      );
      const thumbnail = screen.getByTestId('thumbnail-1');
      expect(thumbnail.dataset.loading).toBe('true');
    });
  });

  describe('Chevron Buttons', () => {
    test('should render left chevron button', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    });

    test('should render right chevron button', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    test('should not render chevrons when movies empty', () => {
      render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    test('should have white color on chevrons', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron.className).toMatch(/text-white/);
    });

    test('should be clickable', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).toBeEnabled();
    });
  });

  describe('Left Chevron Button', () => {
    test('should have hidden class initially', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron.className).toMatch(/hidden/);
    });

    test('should remove hidden class after scroll', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');

      fireEvent.click(rightChevron);

      expect(leftChevron.className).not.toMatch(/hidden/);
    });

    test('should be clickable', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');

      fireEvent.click(rightChevron);
      expect(() => {
        fireEvent.click(leftChevron);
      }).not.toThrow();
    });

    test('should call scrollTo on click', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');

      fireEvent.click(rightChevron);
      fireEvent.click(leftChevron);

      expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });
  });

  describe('Right Chevron Button', () => {
    test('should be visible initially', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');
      expect(rightChevron).toBeInTheDocument();
    });

    test('should be clickable', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');

      expect(() => {
        fireEvent.click(rightChevron);
      }).not.toThrow();
    });

    test('should trigger isMoved state change', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');
      const leftChevron = screen.getByTestId('chevron-left');

      expect(leftChevron.className).toMatch(/hidden/);

      fireEvent.click(rightChevron);

      expect(leftChevron.className).not.toMatch(/hidden/);
    });
  });

  describe('Loading State', () => {
    test('should show loading spinner when movies empty', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should show spinner with animate-spin class', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const spinner = container.querySelector('svg');
      expect(spinner?.getAttribute('class')).toMatch(/animate-spin/);
    });

    test('should have red-600 fill color', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const spinner = container.querySelector('svg');
      expect(spinner?.getAttribute('class')).toMatch(/fill-red-600/);
    });

    test('should have loading text', () => {
      render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should not show loading spinner when movies present', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('should display loading indicator when no movies', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should use output element for empty state', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      expect(container.querySelector('output')).toBeInTheDocument();
    });

    test('should have flex layout for empty state', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const output = container.querySelector('output');
      expect(output?.className).toMatch(/flex/);
      expect(output?.className).toMatch(/items-center/);
      expect(output?.className).toMatch(/justify-center/);
    });

    test('should center empty state content', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const output = container.querySelector('output');
      expect(output?.className).toMatch(/justify-center/);
    });
  });

  describe('Styling', () => {
    test('should have responsive padding', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/px-4/);
      expect(mainDiv.className).toMatch(/md:px-12/);
    });

    test('should have responsive spacing', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/space-y-4/);
      expect(mainDiv.className).toMatch(/md:space-y-8/);
    });

    test('should have responsive margin-top', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/mt-2/);
      expect(mainDiv.className).toMatch(/lg:mt-4/);
    });

    test('should have h-auto class', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/h-auto/);
    });

    test('should have correct height for scroll container', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const scrollContainer = container.querySelector('[class*="h-44"]');
      expect(scrollContainer?.className).toMatch(/h-44/);
    });

    test('should have overflow-x-hidden on scroll container', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const scrollContainer = container.querySelector('[class*="overflow-x-hidden"]');
      expect(scrollContainer?.className).toMatch(/overflow-x-hidden/);
    });
  });

  describe('Scroll Behavior', () => {
    test('should have smoothscroll behavior', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');

      fireEvent.click(rightChevron);

      expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });

    test('should scroll on chevron click', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');

      fireEvent.click(rightChevron);

      expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });

    test('should update isMoved on scroll', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');

      expect(leftChevron.className).toMatch(/hidden/);

      fireEvent.click(screen.getByTestId('chevron-right'));

      expect(leftChevron.className).not.toMatch(/hidden/);
    });
  });

  describe('Hover Effects', () => {
    test('should have group-hover opacity effect', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron.className).toMatch(/group-hover:opacity-100/);
    });

    test('should have hover scale effect', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');
      expect(rightChevron.className).toMatch(/hover:scale-125/);
    });

    test('should have transition class for smooth effects', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron.className).toMatch(/transition/);
    });

    test('should have initial opacity-0', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron.className).toMatch(/opacity-0/);
    });
  });

  describe('Accessibility', () => {
    test('should have accessible button elements', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');
      expect(leftChevron.tagName).toBe('BUTTON');
      expect(rightChevron.tagName).toBe('BUTTON');
    });

    test('should have aria-hidden on SVG', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    test('should have sr-only class for loading text', () => {
      render(
        <FilterRowBase title="Test" movies={[]} isLoading={false} />
      );
      const srText = screen.getByText('Loading...');
      expect(srText.className).toMatch(/sr-only/);
    });

    test('should have semantic structure', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const title = screen.getByText('Test');
      expect(title.tagName).toBe('P');
    });
  });

  describe('Full Integration', () => {
    test('should render complete row with all elements', () => {
      render(
        <FilterRowBase title="All Movies" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('All Movies')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      mockMovies.forEach(movie => {
        expect(screen.getByTestId(`thumbnail-${movie.id}`)).toBeInTheDocument();
      });
    });

    test('should handle multiple interactions', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const rightChevron = screen.getByTestId('chevron-right');
      const leftChevron = screen.getByTestId('chevron-left');

      fireEvent.click(rightChevron);
      expect(leftChevron.className).not.toMatch(/hidden/);

      fireEvent.click(leftChevron);
      expect(leftChevron.className).not.toMatch(/hidden/);
    });

    test('should render correctly with different titles', () => {
      const { rerender } = render(
        <FilterRowBase title="Action" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('Action')).toBeInTheDocument();

      rerender(
        <FilterRowBase title="Drama" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText('Drama')).toBeInTheDocument();
      expect(screen.queryByText('Action')).not.toBeInTheDocument();
    });

    test('should handle movie array changes', () => {
      const { rerender } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();

      rerender(
        <FilterRowBase title="Test" movies={[mockMovies[0]]} isLoading={false} />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.queryByTestId('thumbnail-2')).not.toBeInTheDocument();
    });

    test('should handle loading state toggle', () => {
      const { rerender } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      rerender(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={true} />
      );
      expect(screen.getByTestId('thumbnail-1')).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long title', () => {
      const longTitle = 'This is a very long movie title that should still render properly';
      render(
        <FilterRowBase title={longTitle} movies={mockMovies} isLoading={false} />
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('should handle many movies', () => {
      const manyMovies = Array.from({ length: 50 }, (_, i) => ({
        ...mockMovies[0],
        id: `${i + 1}`,
        title: `Movie ${i + 1}`,
      })) as Movie[];

      render(
        <FilterRowBase title="Many Movies" movies={manyMovies} isLoading={false} />
      );
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-50')).toBeInTheDocument();
    });

    test('should not throw on empty title', () => {
      expect(() => {
        render(
          <FilterRowBase title="" movies={mockMovies} isLoading={false} />
        );
      }).not.toThrow();
    });

    test('should handle null-like values gracefully', () => {
      expect(() => {
        render(
          <FilterRowBase title="Test" movies={[]} isLoading={false} />
        );
      }).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    test('should have mobile-first responsive classes', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toMatch(/px-4/);
      expect(mainDiv.className).toMatch(/md:px-12/);
    });

    test('should have responsive text sizes', () => {
      render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const title = screen.getByText('Test');
      expect(title.className).toMatch(/text-md/);
      expect(title.className).toMatch(/md:text-xl/);
      expect(title.className).toMatch(/lg:text-2xl/);
    });

    test('should have responsive spacing in scroll container', () => {
      const { container } = render(
        <FilterRowBase title="Test" movies={mockMovies} isLoading={false} />
      );
      const scrollContainer = container.querySelector('[class*="space-x"]');
      expect(scrollContainer?.className).toMatch(/space-x-0.5/);
      expect(scrollContainer?.className).toMatch(/md:space-x-2.5/);
    });
  });
});
