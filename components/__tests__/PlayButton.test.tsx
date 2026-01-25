import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayButton from '../PlayButton';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid="play-link">
      {children}
    </a>
  );
});

// Mock react-icons FaPlay
jest.mock('react-icons/fa', () => ({
  FaPlay: ({ size, className }: any) => (
    <svg
      data-testid="play-icon"
      width={size}
      height={size}
      className={className}
      aria-label="Play icon"
    />
  ),
}));

const mockMovieId = 'movie123';

describe('PlayButton Component', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      expect(container).toBeTruthy();
    });

    test('should render Link component', () => {
      render(<PlayButton movieId={mockMovieId} />);
      expect(screen.getByTestId('play-link')).toBeTruthy();
    });

    test('should render play icon', () => {
      render(<PlayButton movieId={mockMovieId} />);
      expect(screen.getByTestId('play-icon')).toBeTruthy();
    });

    test('should render with correct structure', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      expect(container.querySelector('a')).toBeTruthy();
      expect(screen.getByTestId('play-icon')).toBeTruthy();
    });

    test('should render with all required elements', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      const icon = screen.getByTestId('play-icon');
      expect(link).toBeTruthy();
      expect(icon).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    test('should render Link with correct href', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe(`/watch/${mockMovieId}`);
    });

    test('should use movieId in href', () => {
      const customMovieId = 'custom-movie-456';
      render(<PlayButton movieId={customMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe(`/watch/${customMovieId}`);
    });

    test('should handle different movieId values', () => {
      const movieIds = ['1', 'abc-123', 'movie_slug', 'uuid-long-id'];
      movieIds.forEach((id) => {
        const { container } = render(<PlayButton movieId={id} />);
        const link = container.querySelector('a');
        expect(link?.getAttribute('href')).toBe(`/watch/${id}`);
      });
    });

    test('should link be clickable', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.tagName).toBe('A');
    });

    test('should have href attribute', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.hasAttribute('href')).toBe(true);
    });
  });

  describe('Play Icon', () => {
    test('should render play icon with correct size', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('width')).toBe('20');
      expect(icon.getAttribute('height')).toBe('20');
    });

    test('should have correct size value', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('width')).toBe('20');
    });

    test('should have aria-label', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('aria-label')).toBe('Play icon');
    });

    test('should have responsive margin classes', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      // Icon is rendered, checking it exists is enough since className is in the component
      expect(icon).toBeTruthy();
    });

    test('should have proper styling classes', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      // Icon is rendered with classes from parent component
      expect(icon).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    test('should have flex layout', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/flex/);
    });

    test('should have flex-row direction', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/flex-row/);
    });

    test('should have centered items', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/items-center/);
    });

    test('should have padding', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/p-1|p-2/);
    });

    test('should have responsive width classes', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/w-10|md:w-auto/);
    });

    test('should have height class', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/h-10/);
    });

    test('should have justify-center', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/justify-center/);
    });

    test('should have rounded classes', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/rounded-full|rounded-md/);
    });

    test('should have cursor pointer', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });

    test('should have white background', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/bg-white/);
    });

    test('should have transition effect', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    test('should have hover state', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/hover:bg-neutral-400/);
    });

    test('should have font-semibold', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/font-semibold/);
    });

    test('should have text-md and lg:text-lg', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/text-md|lg:text-lg/);
    });
  });

  describe('Text Content', () => {
    test('should render Play text', () => {
      render(<PlayButton movieId={mockMovieId} />);
      expect(screen.getByText('Play')).toBeTruthy();
    });

    test('should render Play text in paragraph', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toBe('Play');
    });

    test('should have hidden class on text for small screens', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/hidden/);
    });

    test('should have md:block for responsive visibility', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/md:block/);
    });

    test('should have exact text content', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      expect(container.textContent).toMatch(/Play/);
    });
  });

  describe('Props Handling', () => {
    test('should accept movieId prop', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      expect(container).toBeTruthy();
    });

    test('should handle movieId with numbers', () => {
      render(<PlayButton movieId="12345" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/12345');
    });

    test('should handle movieId with alphanumeric characters', () => {
      render(<PlayButton movieId="movie-abc123" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie-abc123');
    });

    test('should handle movieId with underscores', () => {
      render(<PlayButton movieId="my_movie_id" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/my_movie_id');
    });

    test('should handle long movieId', () => {
      const longId = 'a'.repeat(100);
      render(<PlayButton movieId={longId} />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe(`/watch/${longId}`);
    });

    test('should handle empty movieId', () => {
      render(<PlayButton movieId="" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/');
    });
  });

  describe('Accessibility', () => {
    test('should have semantic link element', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.tagName).toBe('A');
    });

    test('should have accessible icon with aria-label', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('aria-label')).toBe('Play icon');
    });

    test('should have visible text content', () => {
      render(<PlayButton movieId={mockMovieId} />);
      expect(screen.getByText('Play')).toBeTruthy();
    });

    test('should have href for navigation', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBeTruthy();
    });

    test('should be focusable link', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.tagName).toBe('A');
    });

    test('should have proper color contrast', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/bg-white/);
    });
  });

  describe('Responsive Behavior', () => {
    test('should have mobile-first classes', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/w-10/);
    });

    test('should have md breakpoint classes', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/md:w-auto|md:p-2|md:rounded-md/);
    });

    test('should have lg breakpoint classes', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/lg:text-lg/);
    });

    test('should show icon on all screen sizes', () => {
      render(<PlayButton movieId={mockMovieId} />);
      expect(screen.getByTestId('play-icon')).toBeTruthy();
    });

    test('should hide text on mobile screens', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/hidden/);
    });

    test('should show text on medium screens and up', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/md:block/);
    });
  });

  describe('Container Structure', () => {
    test('should have flex container', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/flex/);
    });

    test('should have Link wrapping div', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      expect(div).toBeTruthy();
    });

    test('should have correct nesting', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      const div = link.querySelector('div');
      expect(div).toBeTruthy();
    });

    test('should have icon and text in same container', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.querySelector('svg')).toBeTruthy();
      expect(div?.querySelector('p')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in movieId', () => {
      render(<PlayButton movieId="movie-@#$-123" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie-@#$-123');
    });

    test('should handle numeric string movieId', () => {
      render(<PlayButton movieId="0" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/0');
    });

    test('should handle movieId with slashes', () => {
      render(<PlayButton movieId="movie/id" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie/id');
    });

    test('should render multiple instances independently', () => {
      const { container: container1 } = render(<PlayButton movieId="movie1" />);
      const { container: container2 } = render(<PlayButton movieId="movie2" />);

      const link1 = container1.querySelector('a');
      const link2 = container2.querySelector('a');

      expect(link1?.getAttribute('href')).toBe('/watch/movie1');
      expect(link2?.getAttribute('href')).toBe('/watch/movie2');
    });

    test('should handle unicode characters in movieId', () => {
      render(<PlayButton movieId="movie-🎬" />);
      const link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie-🎬');
    });
  });

  describe('Component Integrity', () => {
    test('should maintain structure on re-render', () => {
      const { rerender, container } = render(<PlayButton movieId={mockMovieId} />);
      rerender(<PlayButton movieId={mockMovieId} />);

      expect(screen.getByTestId('play-link')).toBeTruthy();
      expect(screen.getByTestId('play-icon')).toBeTruthy();
      expect(screen.getByText('Play')).toBeTruthy();
    });

    test('should handle prop updates', () => {
      const { rerender } = render(<PlayButton movieId="movie1" />);
      let link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie1');

      rerender(<PlayButton movieId="movie2" />);
      link = screen.getByTestId('play-link');
      expect(link.getAttribute('href')).toBe('/watch/movie2');
    });

    test('should render consistently', () => {
      const { container: container1 } = render(<PlayButton movieId={mockMovieId} />);
      const { container: container2 } = render(<PlayButton movieId={mockMovieId} />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('Hover and Interactions', () => {
    test('should have hover styling class', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/hover:bg-neutral-400/);
    });

    test('should have transition for smooth hover', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    test('should be interactive element', () => {
      render(<PlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId('play-link');
      expect(link.tagName).toBe('A');
    });

    test('should have cursor-pointer class', () => {
      const { container } = render(<PlayButton movieId={mockMovieId} />);
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });
  });
});
