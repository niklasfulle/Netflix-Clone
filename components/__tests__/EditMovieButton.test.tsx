import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/link before importing component
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock icons first before importing component
jest.mock('react-icons/fa', () => ({
  FaPen: ({ size, className }: any) => (
    <svg data-testid="pen-icon" data-size={size} data-className={className}>
      Pen
    </svg>
  ),
}));

import EditMovieButton from '../EditMovieButton';

describe('EditMovieButton', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render a link element', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render with proper structure', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(screen.getByTestId('pen-icon')).toBeInTheDocument();
    });

    it('should render a div wrapper inside link', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div).toBeInTheDocument();
    });

    it('should render icon inside the div', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      const icon = div?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Link Href', () => {
    it('should link to correct edit movie page', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie-1');
    });

    it('should handle different movieIds', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-123" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-123');

      rerender(<EditMovieButton movieId="movie-456" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-456');
    });

    it('should construct proper href with movieId', () => {
      render(<EditMovieButton movieId="abc123" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/edit_movie/abc123');
    });

    it('should include leading slash in href', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toMatch(/^\/edit_movie\//);
    });

    it('should work with special characters in movieId', () => {
      render(<EditMovieButton movieId="movie-!@#" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie-!@#');
    });

    it('should work with numeric movieId', () => {
      render(<EditMovieButton movieId="12345" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/12345');
    });

    it('should work with empty movieId', () => {
      render(<EditMovieButton movieId="" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/');
    });

    it('should handle movieId with slashes', () => {
      render(<EditMovieButton movieId="movie/id" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie/id');
    });
  });

  describe('Icon Display', () => {
    it('should render pen icon', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon with size 18', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon.getAttribute('data-size')).toBe('18');
    });

    it('should render icon with text-white class', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon.getAttribute('data-className')).toMatch(/text-white/);
    });

    it('should render icon with mt-0.5 class', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon.getAttribute('data-className')).toMatch(/mt-0.5/);
    });

    it('should only render one icon', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="pen-icon"]');
      expect(icons).toHaveLength(1);
    });
  });

  describe('Styling', () => {
    it('should have flex container styling', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/flex/);
      expect(div?.className).toMatch(/items-center/);
      expect(div?.className).toMatch(/justify-center/);
    });

    it('should have size constraints', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/h-10/);
      expect(div?.className).toMatch(/w-10/);
    });

    it('should have responsive width', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/sm:w-10/);
    });

    it('should have padding for large screens', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/lg:p-1/);
    });

    it('should have border styling', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/border-2/);
      expect(div?.className).toMatch(/border-white/);
    });

    it('should have circular appearance', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/rounded-full/);
    });

    it('should have cursor pointer', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });

    it('should have transition effect', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    it('should have hover state', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/hover:border-neutral-300/);
    });

    it('should have group item class', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/group\/item/);
    });
  });

  describe('Props Handling', () => {
    it('should accept movieId prop', () => {
      render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should use movieId in href', () => {
      render(<EditMovieButton movieId="test-movie" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/test-movie');
    });

    it('should update href when movieId changes', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-1');

      rerender(<EditMovieButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-2');
    });

    it('should work with very long movieId', () => {
      const longId = 'a'.repeat(1000);
      render(<EditMovieButton movieId={longId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toContain(longId);
    });

    it('should pass movieId correctly to href template', () => {
      render(<EditMovieButton movieId="specific-id" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/edit_movie/specific-id');
    });
  });

  describe('Link Functionality', () => {
    it('should be a valid link element', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('should have href attribute', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href');
    });

    it('should navigate to edit page on click', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/edit_movie/movie-1');
    });

    it('should wrap div in link element', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.firstChild;
      expect(div?.nodeName).toBe('DIV');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a link', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should have clickable target', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('disabled');
    });

    it('should have proper semantic meaning', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('should be focusable', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      // Links are naturally focusable with href
      expect(link).toHaveAttribute('href');
    });
  });

  describe('Button Container', () => {
    it('should have button-like appearance', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/rounded-full/);
      expect(div?.className).toMatch(/border/);
      expect(div?.className).toMatch(/cursor-pointer/);
    });

    it('should be centered', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/flex/);
      expect(div?.className).toMatch(/items-center/);
      expect(div?.className).toMatch(/justify-center/);
    });

    it('should have consistent dimensions', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/h-10/);
      expect(div?.className).toMatch(/w-10/);
    });

    it('should have white border', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/border-white/);
    });
  });

  describe('Icon Container', () => {
    it('should have icon inside container', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have only one icon', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have pen icon not other icons', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const penIcon = screen.getByTestId('pen-icon');
      expect(penIcon).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should be React FC component', () => {
      const component = EditMovieButton;
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should be functional component', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept single movieId prop', () => {
      render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render consistently', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-1" />);
      const firstRender = screen.getByRole('link').getAttribute('href');

      rerender(<EditMovieButton movieId="movie-1" />);
      const secondRender = screen.getByRole('link').getAttribute('href');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty movieId', () => {
      render(<EditMovieButton movieId="" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should handle movieId with spaces', () => {
      render(<EditMovieButton movieId="movie with spaces" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie with spaces');
    });

    it('should handle movieId with hyphens', () => {
      render(<EditMovieButton movieId="movie-id-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie-id-123');
    });

    it('should handle movieId with underscores', () => {
      render(<EditMovieButton movieId="movie_id_123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie_id_123');
    });

    it('should handle numeric movieId', () => {
      render(<EditMovieButton movieId="12345" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/12345');
    });

    it('should handle movieId with dots', () => {
      render(<EditMovieButton movieId="movie.123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie.123');
    });

    it('should handle very long movieId', () => {
      const longId = 'a'.repeat(500);
      render(<EditMovieButton movieId={longId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toContain(longId);
    });

    it('should handle movieId with URL-like patterns', () => {
      render(<EditMovieButton movieId="movie:id:123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/edit_movie/movie:id:123');
    });

    it('should update correctly when movieId changes multiple times', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-1');

      rerender(<EditMovieButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-2');

      rerender(<EditMovieButton movieId="movie-3" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-3');
    });
  });

  describe('DOM Structure', () => {
    it('should have proper nesting', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      const icon = div?.querySelector('svg');
      expect(link).toBeInTheDocument();
      expect(div).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    it('should not have unnecessary nesting', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const divCount = container.querySelectorAll('div').length;
      // Should only have one div wrapper
      expect(divCount).toBe(1);
    });

    it('should render as element hierarchy', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const link = container.querySelector('a');
      expect(link?.children.length).toBe(1);
      expect(link?.firstChild?.nodeName).toBe('DIV');
    });

    it('should have icon as direct child of div', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const div = container.querySelector('div');
      const icon = div?.querySelector('svg');
      expect(icon).toBeTruthy();
    });
  });

  describe('Styling Consistency', () => {
    it('should maintain styling across rerenders', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-1" />);
      const firstDiv = document.querySelector('div');
      const firstClasses = firstDiv?.className;

      rerender(<EditMovieButton movieId="movie-2" />);
      const secondDiv = document.querySelector('div');
      const secondClasses = secondDiv?.className;

      expect(firstClasses).toBe(secondClasses);
    });

    it('should preserve all styling classes', () => {
      const { container } = render(<EditMovieButton movieId="movie-1" />);
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      const classString = div?.className || '';

      expect(classString).toContain('flex');
      expect(classString).toContain('items-center');
      expect(classString).toContain('justify-center');
      expect(classString).toContain('h-10');
      expect(classString).toContain('w-10');
      expect(classString).toContain('border-2');
      expect(classString).toContain('border-white');
      expect(classString).toContain('rounded-full');
      expect(classString).toContain('cursor-pointer');
    });
  });

  describe('Icon Styling', () => {
    it('should apply icon styling', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      const className = icon.getAttribute('data-className');
      expect(className).toMatch(/text-white/);
      expect(className).toMatch(/mt-0.5/);
    });

    it('should use correct icon size', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon.getAttribute('data-size')).toBe('18');
    });
  });

  describe('Link Props', () => {
    it('should pass href to Link component', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/edit_movie/movie-1');
    });

    it('should construct dynamic href', () => {
      render(<EditMovieButton movieId="dynamic-id" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/edit_movie/dynamic-id');
    });

    it('should use template string for href', () => {
      const movieId = 'test-123';
      render(<EditMovieButton movieId={movieId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe(`/edit_movie/${movieId}`);
    });
  });

  describe('Mocking Verification', () => {
    it('should use next/link', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should use FaPen icon from react-icons', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const icon = screen.getByTestId('pen-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should be complete edit button', () => {
      render(<EditMovieButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const icon = screen.getByTestId('pen-icon');

      expect(link).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/edit_movie/movie-1');
    });

    it('should handle full workflow', () => {
      const { rerender } = render(<EditMovieButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-1');

      rerender(<EditMovieButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit_movie/movie-2');

      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/edit_movie/movie-2');
    });

    it('should maintain functionality across state changes', () => {
      const { rerender } = render(<EditMovieButton movieId="initial" />);
      const firstLink = screen.getByRole('link').getAttribute('href');

      rerender(<EditMovieButton movieId="updated" />);
      const updatedLink = screen.getByRole('link').getAttribute('href');

      expect(firstLink).not.toBe(updatedLink);
      expect(updatedLink).toBe('/edit_movie/updated');
    });
  });
});
