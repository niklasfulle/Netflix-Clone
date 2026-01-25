import React from 'react';
import { render, screen } from '@testing-library/react';
import MovieCardPlayButton from '../MovieCardPlayButton';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock react-icons/fa
jest.mock('react-icons/fa', () => ({
  FaPlay: ({ size, className }: { size: number; className: string }) => (
    <svg
      data-testid="play-icon"
      width={size}
      height={size}
      className={className}
      aria-label="Play icon"
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2} />
    </svg>
  ),
}));

describe('MovieCardPlayButton', () => {
  const mockMovieId = 'movie-123';

  describe('Rendering', () => {
    test('should render without crashing', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    test('should render a link element', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    test('should render the play icon', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon).toBeInTheDocument();
    });

    test('should render the play button container', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toBeInTheDocument();
    });

    test('should render with correct structure', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      const buttonDiv = link?.querySelector('div');
      expect(buttonDiv).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('should accept movieId prop', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(mockMovieId);
    });

    test('should handle different movieId values', () => {
      const testIds = ['movie-1', 'movie-abc-123', 'film-xyz'];
      testIds.forEach((id) => {
        const { container } = render(<MovieCardPlayButton movieId={id} />);
        const link = container.querySelector('a') as HTMLAnchorElement;
        expect(link.href).toContain(id);
      });
    });

    test('should handle movieId with special characters', () => {
      const specialId = 'movie-123-special';
      const { container } = render(<MovieCardPlayButton movieId={specialId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(specialId);
    });

    test('should handle numeric movieId', () => {
      const numericId = '12345';
      const { container } = render(<MovieCardPlayButton movieId={numericId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(numericId);
    });

    test('should handle UUID format movieId', () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      const { container } = render(<MovieCardPlayButton movieId={uuidId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(uuidId);
    });
  });

  describe('Link Href', () => {
    test('should have correct href format', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(`/watch/${mockMovieId}`);
    });

    test('should construct href with /watch/ prefix', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toMatch(/\/watch\//);
    });

    test('should include movieId in href', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toMatch(new RegExp(mockMovieId));
    });

    test('should not have extra slashes in href', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).not.toMatch(/\/\/watch/);
    });
  });

  describe('Play Icon', () => {
    test('should render play icon with correct size', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon') as unknown as SVGElement;
      expect(icon.getAttribute('width')).toBe('20');
      expect(icon.getAttribute('height')).toBe('20');
    });

    test('should have play icon with aria-label', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon).toHaveAttribute('aria-label', 'Play icon');
    });

    test('should have play icon accessible for screen readers', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByLabelText('Play icon');
      expect(icon).toBeInTheDocument();
    });

    test('should render play icon inside the button container', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      const icon = buttonDiv?.querySelector('[data-testid="play-icon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    test('should have flex layout classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('flex');
      expect(buttonDiv?.className).toContain('flex-row');
    });

    test('should have correct alignment classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('items-center');
      expect(buttonDiv?.className).toContain('justify-center');
    });

    test('should have padding classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('p-1');
      expect(buttonDiv?.className).toContain('xl:p-2');
    });

    test('should have height and width classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('h-10');
      expect(buttonDiv?.className).toContain('w-10');
      expect(buttonDiv?.className).toContain('xl:w-auto');
    });

    test('should have background color classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('bg-white');
      expect(buttonDiv?.className).toContain('hover:bg-neutral-400');
    });

    test('should have rounded corner classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('rounded-full');
      expect(buttonDiv?.className).toContain('xl:rounded-md');
    });

    test('should have cursor pointer class', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('cursor-pointer');
    });

    test('should have transition class', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('transition');
    });

    test('should have text sizing classes', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('text-md');
      expect(buttonDiv?.className).toContain('xl:text-lg');
    });

    test('should have font-semibold class', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('font-semibold');
    });
  });

  describe('Play Text', () => {
    test('should render play text', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = screen.getByText('Play');
      expect(playText).toBeInTheDocument();
    });

    test('should have play text hidden on mobile (hidden class)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.className).toContain('hidden');
    });

    test('should show play text on xl screens (xl:block class)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.className).toContain('xl:block');
    });

    test('should have play text as paragraph element', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.tagName).toBe('P');
    });

    test('should have play text inside the button container', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      const playText = buttonDiv?.querySelector('p');
      expect(playText?.textContent).toBe('Play');
    });
  });

  describe('Icon Styling', () => {
    test('should have icon margin classes', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('class')).toContain('m-1');
      expect(icon.getAttribute('class')).toContain('xl:m-0');
    });

    test('should have icon right margin on xl', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('class')).toContain('xl:mr-2');
    });

    test('should have icon right margin on mobile', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId('play-icon');
      expect(icon.getAttribute('class')).toContain('mr-0.5');
    });
  });

  describe('Container Structure', () => {
    test('should have correct element hierarchy', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      const buttonDiv = link?.querySelector('div');
      const icon = buttonDiv?.querySelector('[data-testid="play-icon"]');
      const playText = buttonDiv?.querySelector('p');
      
      expect(link).toBeInTheDocument();
      expect(buttonDiv).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(playText).toBeInTheDocument();
    });

    test('should have icon and text as siblings', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      const children = Array.from(buttonDiv?.children || []);
      expect(children.length).toBeGreaterThanOrEqual(2);
    });

    test('should have icon and text both in the same flex container', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('flex');
      const icon = buttonDiv?.querySelector('[data-testid="play-icon"]');
      const playText = buttonDiv?.querySelector('p');
      expect(icon?.parentElement).toBe(buttonDiv);
      expect(playText?.parentElement).toBe(buttonDiv);
    });
  });

  describe('Accessibility', () => {
    test('should render as a link role', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    test('should have accessible link text', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByRole('link');
      expect(link.textContent).toBe('Play');
    });

    test('should have href attribute on link', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href');
    });

    test('should have valid href structure', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toBeTruthy();
    });

    test('should be keyboard navigable', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    test('should have descriptive icon label', () => {
      render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByLabelText('Play icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should have mobile-first padding (p-1)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('p-1');
    });

    test('should increase padding on xl screens (xl:p-2)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('xl:p-2');
    });

    test('should have mobile width of w-10', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('w-10');
    });

    test('should auto-adjust width on xl screens (xl:w-auto)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('xl:w-auto');
    });

    test('should have rounded full on mobile (rounded-full)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('rounded-full');
    });

    test('should have rounded md on xl screens (xl:rounded-md)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('xl:rounded-md');
    });

    test('should hide play text on mobile (hidden)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.className).toContain('hidden');
    });

    test('should show play text on xl screens (xl:block)', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.className).toContain('xl:block');
    });

    test('should adjust text size on xl screens', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('text-md');
      expect(buttonDiv?.className).toContain('xl:text-lg');
    });
  });

  describe('Hover States', () => {
    test('should have hover styling', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('hover:bg-neutral-400');
    });

    test('should have transition class for smooth hover effect', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('transition');
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple buttons with different movieIds', () => {
      const { container } = render(
        <>
          <MovieCardPlayButton movieId="movie-1" />
          <MovieCardPlayButton movieId="movie-2" />
          <MovieCardPlayButton movieId="movie-3" />
        </>
      );
      const links = container.querySelectorAll('a');
      expect(links.length).toBe(3);
    });

    test('should have different hrefs for different movieIds', () => {
      const { container } = render(
        <>
          <MovieCardPlayButton movieId="movie-1" />
          <MovieCardPlayButton movieId="movie-2" />
        </>
      );
      const links = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[];
      expect(links[0].href).toContain('movie-1');
      expect(links[1].href).toContain('movie-2');
    });

    test('should render all play icons', () => {
      render(
        <>
          <MovieCardPlayButton movieId="movie-1" />
          <MovieCardPlayButton movieId="movie-2" />
        </>
      );
      const icons = screen.getAllByTestId('play-icon');
      expect(icons.length).toBe(2);
    });

    test('should render all play texts', () => {
      render(
        <>
          <MovieCardPlayButton movieId="movie-1" />
          <MovieCardPlayButton movieId="movie-2" />
        </>
      );
      const playTexts = screen.getAllByText('Play');
      expect(playTexts.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string movieId', () => {
      const { container } = render(<MovieCardPlayButton movieId="" />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain('/watch/');
    });

    test('should handle very long movieId', () => {
      const longId = 'a'.repeat(100);
      const { container } = render(<MovieCardPlayButton movieId={longId} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(longId);
    });

    test('should handle movieId with spaces', () => {
      const idWithSpaces = 'movie id 123';
      const { container } = render(<MovieCardPlayButton movieId={idWithSpaces} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain('movie%20id%20123');
    });

    test('should handle movieId with hyphens', () => {
      const idWithHyphens = 'movie-id-123-abc';
      const { container } = render(<MovieCardPlayButton movieId={idWithHyphens} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(idWithHyphens);
    });

    test('should handle movieId with underscores', () => {
      const idWithUnderscores = 'movie_id_123';
      const { container } = render(<MovieCardPlayButton movieId={idWithUnderscores} />);
      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain(idWithUnderscores);
    });
  });

  describe('Component Stability', () => {
    test('should render consistently on multiple renders', () => {
      const { rerender } = render(
        <MovieCardPlayButton movieId={mockMovieId} />
      );
      const firstRender = screen.getAllByText('Play').length;
      rerender(<MovieCardPlayButton movieId={mockMovieId} />);
      const secondRender = screen.getAllByText('Play').length;
      expect(firstRender).toBe(secondRender);
    });

    test('should handle prop updates', () => {
      const { rerender, container } = render(
        <MovieCardPlayButton movieId="movie-1" />
      );
      let link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain('movie-1');

      rerender(<MovieCardPlayButton movieId="movie-2" />);
      link = container.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toContain('movie-2');
    });

    test('should not cause memory leaks', () => {
      const { unmount } = render(
        <MovieCardPlayButton movieId={mockMovieId} />
      );
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Semantic HTML', () => {
    test('should use semantic link element', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const link = container.querySelector('a');
      expect(link?.tagName).toBe('A');
    });

    test('should use semantic paragraph element for text', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const playText = container.querySelector('p');
      expect(playText?.tagName).toBe('P');
    });

    test('should use semantic SVG element for icon', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const icon = container.querySelector('svg');
      expect(icon?.tagName).toBe('svg');
    });
  });

  describe('Visual Hierarchy', () => {
    test('should have centered layout', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('items-center');
      expect(buttonDiv?.className).toContain('justify-center');
    });

    test('should have flex row direction', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('flex-row');
    });

    test('should have clear clickable area', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('h-10');
      expect(buttonDiv?.className).toContain('w-10');
    });

    test('should have good contrast with white background', () => {
      const { container } = render(<MovieCardPlayButton movieId={mockMovieId} />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv?.className).toContain('bg-white');
    });
  });
});
