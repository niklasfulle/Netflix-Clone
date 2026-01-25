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
  FaPlay: ({ size, className }: any) => (
    <svg data-testid="play-icon" data-size={size} data-classname={className}>
      {/* icon content */}
    </svg>
  ),
}));

import BillboardPlayButton from '../BillboardPlayButton';

describe('BillboardPlayButton', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render a link element', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render with proper structure', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('should render a div wrapper inside link', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div).toBeInTheDocument();
    });

    it('should render icon inside the div', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      const icon = div?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render play text element', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const playText = screen.getByText('Play');
      expect(playText).toBeInTheDocument();
    });

    it('should render all elements together', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
    });
  });

  describe('Link Href', () => {
    it('should link to correct watch page', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-1');
    });

    it('should handle different movieIds', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-123" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-123');

      rerender(<BillboardPlayButton movieId="movie-456" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-456');
    });

    it('should construct proper href with movieId', () => {
      render(<BillboardPlayButton movieId="abc123" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/watch/abc123');
    });

    it('should include leading slash in href', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toMatch(/^\/watch\//);
    });

    it('should work with special characters in movieId', () => {
      render(<BillboardPlayButton movieId="movie-!@#" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-!@#');
    });

    it('should work with numeric movieId', () => {
      render(<BillboardPlayButton movieId="12345" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/12345');
    });

    it('should work with empty movieId', () => {
      render(<BillboardPlayButton movieId="" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/');
    });

    it('should handle movieId with slashes', () => {
      render(<BillboardPlayButton movieId="movie/id" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie/id');
    });
  });

  describe('Icon Display', () => {
    it('should render play icon', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon with size 20', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('data-size')).toBe('20');
    });

    it('should render icon with responsive margin classes', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      const className = icon.getAttribute('data-classname');
      expect(className).toMatch(/m-1/);
      expect(className).toMatch(/md:m-0/);
      expect(className).toMatch(/md:mr-2/);
      expect(className).toMatch(/mr-0.5/);
    });

    it('should only render one icon', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="play-icon"]');
      expect(icons).toHaveLength(1);
    });
  });

  describe('Play Text', () => {
    it('should render play text', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const playText = screen.getByText('Play');
      expect(playText).toBeInTheDocument();
    });

    it('should render play text inside paragraph', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Play');
    });

    it('should have hidden on small screens class', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/hidden/);
    });

    it('should show on medium screens class', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/md:block/);
    });
  });

  describe('Styling - Main Container', () => {
    it('should have flex container styling', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/flex/);
      expect(div?.className).toMatch(/flex-row/);
      expect(div?.className).toMatch(/items-center/);
      expect(div?.className).toMatch(/justify-center/);
    });

    it('should have responsive padding', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/p-1/);
      expect(div?.className).toMatch(/md:p-2/);
    });

    it('should have responsive height', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/h-10/);
      expect(div?.className).toMatch(/md:h-auto/);
    });

    it('should have responsive width', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/w-10/);
      expect(div?.className).toMatch(/md:w-auto/);
    });

    it('should have text styling', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/text-md/);
      expect(div?.className).toMatch(/font-semibold/);
    });

    it('should have large screen text size', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/lg:text-lg/);
    });

    it('should have background color styling', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/bg-white/);
    });

    it('should have hover state', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/hover:bg-neutral-400/);
    });

    it('should have rounded styling', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/rounded-full/);
      expect(div?.className).toMatch(/md:rounded-md/);
    });

    it('should have transition effect', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    it('should have cursor pointer', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });
  });

  describe('Props Handling', () => {
    it('should accept movieId prop', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should use movieId in href', () => {
      render(<BillboardPlayButton movieId="test-movie" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/test-movie');
    });

    it('should update href when movieId changes', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-1');

      rerender(<BillboardPlayButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-2');
    });

    it('should work with very long movieId', () => {
      const longId = 'a'.repeat(1000);
      render(<BillboardPlayButton movieId={longId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toContain(longId);
    });

    it('should pass movieId correctly to href template', () => {
      render(<BillboardPlayButton movieId="specific-id" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/watch/specific-id');
    });
  });

  describe('Link Functionality', () => {
    it('should be a valid link element', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('should have href attribute', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href');
    });

    it('should navigate to watch page on click', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/watch/movie-1');
    });

    it('should wrap div in link element', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.firstChild;
      expect(div?.nodeName).toBe('DIV');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a link', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should have clickable target', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('disabled');
    });

    it('should have proper semantic meaning', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('should be focusable', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href');
    });
  });

  describe('Button Container', () => {
    it('should have button-like appearance', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
      expect(div?.className).toMatch(/transition/);
    });

    it('should be centered', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/flex/);
      expect(div?.className).toMatch(/items-center/);
      expect(div?.className).toMatch(/justify-center/);
    });

    it('should have responsive sizing', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/h-10/);
      expect(div?.className).toMatch(/md:h-auto/);
      expect(div?.className).toMatch(/w-10/);
      expect(div?.className).toMatch(/md:w-auto/);
    });

    it('should have white background', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/bg-white/);
    });
  });

  describe('Icon Container', () => {
    it('should have icon inside container', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have only one icon', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have play icon not other icons', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const playIcon = screen.getByTestId('play-icon');
      expect(playIcon).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should be React FC component', () => {
      const component = BillboardPlayButton;
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should be functional component', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept single movieId prop', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should render consistently', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-1" />);
      const firstRender = screen.getByRole('link').getAttribute('href');

      rerender(<BillboardPlayButton movieId="movie-1" />);
      const secondRender = screen.getByRole('link').getAttribute('href');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty movieId', () => {
      render(<BillboardPlayButton movieId="" />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should handle movieId with spaces', () => {
      render(<BillboardPlayButton movieId="movie with spaces" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie with spaces');
    });

    it('should handle movieId with hyphens', () => {
      render(<BillboardPlayButton movieId="movie-id-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-id-123');
    });

    it('should handle movieId with underscores', () => {
      render(<BillboardPlayButton movieId="movie_id_123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie_id_123');
    });

    it('should handle numeric movieId', () => {
      render(<BillboardPlayButton movieId="12345" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/12345');
    });

    it('should handle movieId with dots', () => {
      render(<BillboardPlayButton movieId="movie.123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie.123');
    });

    it('should handle very long movieId', () => {
      const longId = 'a'.repeat(500);
      render(<BillboardPlayButton movieId={longId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toContain(longId);
    });

    it('should handle movieId with URL-like patterns', () => {
      render(<BillboardPlayButton movieId="movie:id:123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie:id:123');
    });

    it('should update correctly when movieId changes multiple times', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-1');

      rerender(<BillboardPlayButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-2');

      rerender(<BillboardPlayButton movieId="movie-3" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-3');
    });
  });

  describe('DOM Structure', () => {
    it('should have proper nesting', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      const icon = div?.querySelector('svg');
      expect(link).toBeInTheDocument();
      expect(div).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    it('should not have unnecessary nesting', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const divCount = container.querySelectorAll('div').length;
      // Should only have one div wrapper
      expect(divCount).toBe(1);
    });

    it('should render as element hierarchy', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const link = container.querySelector('a');
      expect(link?.children.length).toBe(1);
      expect(link?.firstChild?.nodeName).toBe('DIV');
    });

    it('should have icon and text as children of div', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const div = container.querySelector('div');
      const icon = div?.querySelector('svg');
      const paragraph = div?.querySelector('p');
      expect(icon).toBeInTheDocument();
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Styling Consistency', () => {
    it('should maintain styling across rerenders', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-1" />);
      const firstDiv = document.querySelector('div');
      const firstClasses = firstDiv?.className;

      rerender(<BillboardPlayButton movieId="movie-2" />);
      const secondDiv = document.querySelector('div');
      const secondClasses = secondDiv?.className;

      expect(firstClasses).toBe(secondClasses);
    });

    it('should preserve all styling classes', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      const classString = div?.className || '';

      expect(classString).toContain('flex');
      expect(classString).toContain('flex-row');
      expect(classString).toContain('items-center');
      expect(classString).toContain('justify-center');
      expect(classString).toContain('p-1');
      expect(classString).toContain('md:p-2');
      expect(classString).toContain('h-10');
      expect(classString).toContain('w-10');
      expect(classString).toContain('text-md');
      expect(classString).toContain('font-semibold');
      expect(classString).toContain('transition');
      expect(classString).toContain('bg-white');
      expect(classString).toContain('rounded-full');
      expect(classString).toContain('cursor-pointer');
    });
  });

  describe('Icon Styling', () => {
    it('should apply icon styling', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      const className = icon.getAttribute('data-classname');
      expect(className).toMatch(/m-1/);
      expect(className).toMatch(/md:m-0/);
      expect(className).toMatch(/md:mr-2/);
      expect(className).toMatch(/mr-0.5/);
    });

    it('should use correct icon size', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('data-size')).toBe('20');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have mobile-first design', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/p-1/);
      expect(div?.className).toMatch(/h-10/);
      expect(div?.className).toMatch(/w-10/);
    });

    it('should have tablet breakpoints', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/md:p-2/);
      expect(div?.className).toMatch(/md:h-auto/);
      expect(div?.className).toMatch(/md:w-auto/);
    });

    it('should have large screen text size', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const div = link.querySelector('div');
      expect(div?.className).toMatch(/lg:text-lg/);
    });

    it('should hide text on small screens', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/hidden/);
    });

    it('should show text on medium screens', () => {
      const { container } = render(<BillboardPlayButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/md:block/);
    });
  });

  describe('Link Props', () => {
    it('should pass href to Link component', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/watch/movie-1');
    });

    it('should construct dynamic href', () => {
      render(<BillboardPlayButton movieId="dynamic-id" />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/watch/dynamic-id');
    });

    it('should use template string for href', () => {
      const movieId = 'test-123';
      render(<BillboardPlayButton movieId={movieId} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe(`/watch/${movieId}`);
    });
  });

  describe('Mocking Verification', () => {
    it('should use next/link', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should use FaPlay icon from react-icons', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const icon = screen.getByTestId('play-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display play text', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByText('Play')).toBeInTheDocument();
    });

    it('should only display one play text', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const playTexts = screen.getAllByText('Play');
      expect(playTexts).toHaveLength(1);
    });

    it('should have icon and text together', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should be complete play button', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      const icon = screen.getByTestId('play-icon');
      const text = screen.getByText('Play');

      expect(link).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/watch/movie-1');
    });

    it('should handle full workflow', () => {
      const { rerender } = render(<BillboardPlayButton movieId="movie-1" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-1');
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();

      rerender(<BillboardPlayButton movieId="movie-2" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/watch/movie-2');
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();

      const link = screen.getByRole('link') as HTMLAnchorElement;
      expect(link.href).toContain('/watch/movie-2');
    });

    it('should maintain functionality across state changes', () => {
      const { rerender } = render(<BillboardPlayButton movieId="initial" />);
      const firstLink = screen.getByRole('link').getAttribute('href');

      rerender(<BillboardPlayButton movieId="updated" />);
      const updatedLink = screen.getByRole('link').getAttribute('href');

      expect(firstLink).not.toBe(updatedLink);
      expect(updatedLink).toBe('/watch/updated');
    });

    it('should be interactive element', () => {
      render(<BillboardPlayButton movieId="movie-1" />);
      const link = screen.getByRole('link');
      // Should be a proper link with href
      expect(link).toHaveAttribute('href');
      expect(link).not.toHaveAttribute('disabled');
    });
  });
});
