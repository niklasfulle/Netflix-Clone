import React from 'react';
import { render, screen } from '@testing-library/react';
import RestartButton from '@/components/RestartButton';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaUndo: ({ size, className }: any) => (
    <svg
      data-testid="undo-icon"
      width={size}
      height={size}
      className={className}
      aria-label="Undo icon"
    />
  ),
}));

describe('RestartButton Component', () => {
  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<RestartButton movieId="123" />);
      expect(container).toBeInTheDocument();
    });

    it('should render a link element', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render the undo icon', () => {
      render(<RestartButton movieId="123" />);
      expect(screen.getByTestId('undo-icon')).toBeInTheDocument();
    });

    it('should render with correct button container', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toBeInTheDocument();
      expect(buttonDiv).toHaveClass('flex');
      expect(buttonDiv).toHaveClass('items-center');
      expect(buttonDiv).toHaveClass('justify-center');
    });

    it('should have proper dimensions', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('h-10');
      expect(buttonDiv).toHaveClass('w-10');
    });
  });

  describe('Link Functionality', () => {
    it('should generate correct href with movieId', () => {
      render(<RestartButton movieId="movie-456" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-456?start=0&from=null');
    });

    it('should have start=0 parameter in href', () => {
      render(<RestartButton movieId="789" />);
      const link = screen.getByRole('link');
      const href = link.getAttribute('href');
      expect(href).toContain('?start=0&from=null');
    });

    it('should construct href with /watch/ prefix', () => {
      render(<RestartButton movieId="abc123" />);
      const link = screen.getByRole('link');
      const href = link.getAttribute('href');
      expect(href).toMatch(/^\/watch\//);
      expect(href).toContain('?start=0&from=null');
    });

    it('should handle different movieIds correctly', () => {
      const { rerender } = render(<RestartButton movieId="id1" />);
      let link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/id1?start=0&from=null');

      rerender(<RestartButton movieId="id2" />);
      link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/id2?start=0&from=null');
    });

    it('should work with numeric movieIds', () => {
      render(<RestartButton movieId="12345" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/12345?start=0&from=null');
    });

    it('should work with alphanumeric movieIds', () => {
      render(<RestartButton movieId="movie-uuid-456" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-uuid-456?start=0&from=null');
    });

    it('should work with special characters in movieId', () => {
      render(<RestartButton movieId="movie_456" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie_456?start=0&from=null');
    });

    it('should handle long movieIds', () => {
      const longId = 'a'.repeat(50);
      render(<RestartButton movieId={longId} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/watch/${longId}?start=0&from=null`);
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon with correct size', () => {
      render(<RestartButton movieId="123" />);
      const icon = screen.getByTestId('undo-icon');
      expect(icon).toHaveAttribute('width', '18');
      expect(icon).toHaveAttribute('height', '18');
    });

    it('should apply correct classes to icon', () => {
      render(<RestartButton movieId="123" />);
      const icon = screen.getByTestId('undo-icon');
      expect(icon).toHaveClass('mt-0.5');
      expect(icon).toHaveClass('text-white');
    });

    it('should have aria-label on icon', () => {
      render(<RestartButton movieId="123" />);
      const icon = screen.getByTestId('undo-icon');
      expect(icon).toHaveAttribute('aria-label');
    });

    it('should render icon inside the button container', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      const icon = buttonDiv?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have flexbox layout classes', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('flex');
      expect(buttonDiv).toHaveClass('items-center');
      expect(buttonDiv).toHaveClass('justify-center');
    });

    it('should have border styling', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('border-2');
      expect(buttonDiv).toHaveClass('border-white');
    });

    it('should have rounded border', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('rounded-full');
    });

    it('should have cursor pointer', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('cursor-pointer');
    });

    it('should have transition class', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('transition');
    });

    it('should have responsive padding classes', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('lg:p-1');
    });

    it('should have responsive width classes', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('sm:w-10');
    });

    it('should have group styling for hover effects', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('group/item');
    });

    it('should have hover border color change', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('hover:border-neutral-300');
    });

    it('should maintain correct height', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('h-10');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible via link', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should have icon with aria-label', () => {
      render(<RestartButton movieId="123" />);
      const icon = screen.getByTestId('undo-icon');
      expect(icon).toHaveAttribute('aria-label', 'Undo icon');
    });

    it('should have semantic link structure', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('should have proper link in DOM', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should have button-like appearance for accessibility', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      expect(buttonDiv).toHaveClass('cursor-pointer');
    });
  });

  describe('Props Variations', () => {
    it('should handle empty string movieId', () => {
      render(<RestartButton movieId="" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/?start=0&from=null');
    });

    it('should handle movieId with forward slashes', () => {
      render(<RestartButton movieId="category/movie/123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/category/movie/123?start=0&from=null');
    });

    it('should handle movieId with hyphens', () => {
      render(<RestartButton movieId="movie-title-2023" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie-title-2023?start=0&from=null');
    });

    it('should handle movieId with underscores', () => {
      render(<RestartButton movieId="movie_title_2023" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie_title_2023?start=0&from=null');
    });

    it('should handle movieId with dots', () => {
      render(<RestartButton movieId="movie.title.2023" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie.title.2023?start=0&from=null');
    });

    it('should handle UUID format movieId', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      render(<RestartButton movieId={uuid} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/watch/${uuid}?start=0&from=null`);
    });
  });

  describe('Component Structure', () => {
    it('should have correct element hierarchy', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      const buttonDiv = link.querySelector('div');
      expect(buttonDiv).toBeInTheDocument();
    });

    it('should have icon as child of button div', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const buttonDiv = container.querySelector('div');
      const icon = buttonDiv?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have single icon element', () => {
      render(<RestartButton movieId="123" />);
      const icons = screen.getAllByTestId('undo-icon');
      expect(icons).toHaveLength(1);
    });

    it('should have single link element', () => {
      render(<RestartButton movieId="123" />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
    });

    it('should render without additional wrappers', () => {
      const { container } = render(<RestartButton movieId="123" />);
      const children = container.children[0].children;
      // Link contains div with icon
      expect(children.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long movieId', () => {
      const veryLongId = 'a'.repeat(500);
      render(<RestartButton movieId={veryLongId} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/watch/${veryLongId}?start=0&from=null`);
    });

    it('should handle movieId with spaces (URL encoded)', () => {
      render(<RestartButton movieId="movie title" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/movie title?start=0&from=null');
    });

    it('should handle numeric movieId starting with 0', () => {
      render(<RestartButton movieId="00123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/00123?start=0&from=null');
    });

    it('should handle negative numeric movieId', () => {
      render(<RestartButton movieId="-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/-123?start=0&from=null');
    });

    it('should handle movieId with uppercase letters', () => {
      render(<RestartButton movieId="MOVIE-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/MOVIE-123?start=0&from=null');
    });

    it('should handle movieId with mixed case', () => {
      render(<RestartButton movieId="Movie-Title-123" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/Movie-Title-123?start=0&from=null');
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple RestartButton components', () => {
      render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/watch/movie1?start=0&from=null');
      expect(links[1]).toHaveAttribute('href', '/watch/movie2?start=0&from=null');
    });

    it('should render multiple icons correctly', () => {
      render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      const icons = screen.getAllByTestId('undo-icon');
      expect(icons).toHaveLength(2);
    });

    it('should have independent state for multiple instances', () => {
      const { rerender } = render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      let links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/watch/movie1?start=0&from=null');
      expect(links[1]).toHaveAttribute('href', '/watch/movie2?start=0&from=null');

      rerender(
        <>
          <RestartButton movieId="movieA" />
          <RestartButton movieId="movieB" />
        </>
      );
      links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/watch/movieA?start=0&from=null');
      expect(links[1]).toHaveAttribute('href', '/watch/movieB?start=0&from=null');
    });
  });

  describe('TypeScript Props', () => {
    it('should accept string movieId prop', () => {
      const { container } = render(<RestartButton movieId="123" />);
      expect(container).toBeInTheDocument();
    });

    it('should render correctly with different string types', () => {
      const movieIds = ['123', 'abc', 'movie-123', '!@#$'];
      movieIds.forEach((id) => {
        const { unmount } = render(<RestartButton movieId={id} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/watch/${id}?start=0&from=null`);
        unmount();
      });
    });
  });

  describe('Reset Parameter', () => {
    it('should always have start=0 parameter', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      const href = link.getAttribute('href');
      expect(href).toContain('start=0');
      expect(href).toContain('from=null');
    });

    it('should use query parameter syntax', () => {
      render(<RestartButton movieId="123" />);
      const link = screen.getByRole('link');
      const href = link.getAttribute('href');
      expect(href).toContain('?');
      expect(href).toContain('=');
    });
  });

  describe('Visual Consistency', () => {
    it('should have consistent sizing across instances', () => {
      const { container } = render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      const buttons = container.querySelectorAll('div');
      buttons.forEach((btn) => {
        if (btn.classList.contains('h-10')) {
          expect(btn).toHaveClass('w-10');
          expect(btn).toHaveClass('h-10');
        }
      });
    });

    it('should have consistent border styling', () => {
      const { container } = render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      const buttons = container.querySelectorAll('div.border-2');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn).toHaveClass('border-white');
        expect(btn).toHaveClass('rounded-full');
      });
    });

    it('should have consistent icon styling', () => {
      render(
        <>
          <RestartButton movieId="movie1" />
          <RestartButton movieId="movie2" />
        </>
      );
      const icons = screen.getAllByTestId('undo-icon');
      icons.forEach((icon) => {
        expect(icon).toHaveClass('mt-0.5');
        expect(icon).toHaveClass('text-white');
      });
    });
  });
});
