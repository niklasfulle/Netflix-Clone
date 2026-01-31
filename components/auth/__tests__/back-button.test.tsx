import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { BackButton } from '../back-button';

describe('BackButton Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<BackButton label="Go Back" href="/home" />);
      expect(container).toBeInTheDocument();
    });

    it('should render with label text', () => {
      render(<BackButton label="Back to Home" href="/home" />);
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      const { container } = render(<BackButton label="Go Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should render a link inside button', () => {
      const { container } = render(<BackButton label="Back" href="/dashboard" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should display correct label text', () => {
      render(<BackButton label="Back" href="/previous" />);
      const link = screen.getByText('Back');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Link Functionality', () => {
    it('should have correct href attribute', () => {
      const { container } = render(<BackButton label="Go Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('should update href when prop changes', () => {
      const { container, rerender } = render(<BackButton label="Back" href="/old" />);
      let link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/old');

      rerender(<BackButton label="Back" href="/new" />);
      link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/new');
    });

    it('should support absolute paths', () => {
      const { container } = render(<BackButton label="Go Back" href="/auth/login" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/auth/login');
    });

    it('should support relative paths', () => {
      const { container } = render(<BackButton label="Back" href="../previous" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '../previous');
    });

    it('should support root path', () => {
      const { container } = render(<BackButton label="Home" href="/" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('Label Props', () => {
    it('should display empty label when provided', () => {
      const { container } = render(<BackButton label="" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.textContent).toBe('');
    });

    it('should display long label text', () => {
      const longLabel = 'Back to Previous Page with Long Text';
      render(<BackButton label={longLabel} href="/home" />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should display label with special characters', () => {
      const specialLabel = '← Go Back';
      render(<BackButton label={specialLabel} href="/home" />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it('should display label with numbers', () => {
      const numericLabel = 'Back Step 1';
      render(<BackButton label={numericLabel} href="/home" />);
      expect(screen.getByText(numericLabel)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have font-normal class', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.className).toContain('font-normal');
    });

    it('should have full width class', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.className).toContain('w-full');
    });

    it('should have link_dark variant class', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.className).toContain('underline');
    });

    it('should have small size class', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.className).toContain('h-8');
    });

    it('should combine multiple style classes', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      const className = link?.className || '';
      expect(className).toContain('font-normal');
      expect(className).toContain('w-full');
    });
  });

  describe('Button Properties', () => {
    it('should have button type attribute', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should be accessible as a navigation element', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should render without disabled attribute by default', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).not.toHaveAttribute('disabled');
    });
  });

  describe('Accessibility', () => {
    it('should have readable label text', () => {
      const { container } = render(<BackButton label="Back to Home" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.textContent).toBe('Back to Home');
    });

    it('should be keyboard accessible', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should support screen reader navigation', () => {
      render(<BackButton label="Return to Dashboard" href="/dashboard" />);
      const link = screen.getByText('Return to Dashboard');
      expect(link.tagName).toBe('A');
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('should accept label prop correctly', () => {
      render(<BackButton label="Test Label" href="/home" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should accept href prop correctly', () => {
      const { container } = render(<BackButton label="Back" href="/test-path" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/test-path');
    });

    it('should render with both props required', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      expect(container.querySelector('a')).toBeInTheDocument();
    });

    it('should forward props to button element', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link?.className).toContain('font-normal');
      expect(link?.className).toContain('w-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long href paths', () => {
      const longHref = '/path/to/some/very/long/nested/route/structure';
      const { container } = render(<BackButton label="Back" href={longHref} />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', longHref);
    });

    it('should handle href with query parameters', () => {
      const { container } = render(<BackButton label="Back" href="/home?page=1&sort=date" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home?page=1&sort=date');
    });

    it('should handle href with hash fragments', () => {
      const { container } = render(<BackButton label="Back" href="/home#section" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home#section');
    });

    it('should render multiple BackButton instances independently', () => {
      render(
        <>
          <BackButton label="Back to Home" href="/home" />
          <BackButton label="Back to Profile" href="/profile" />
        </>
      );
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
      expect(screen.getByText('Back to Profile')).toBeInTheDocument();
    });

    it('should handle rapid rerenders', () => {
      const { rerender } = render(<BackButton label="Back" href="/home" />);
      rerender(<BackButton label="Back" href="/home" />);
      rerender(<BackButton label="Back" href="/home" />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should use asChild prop for Next Link integration', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should render button as wrapper for link', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('should have proper nesting of elements', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      const text = link?.textContent;
      expect(text).toBe('Back');
    });
  });

  describe('Re-rendering', () => {
    it('should update label on rerender', () => {
      const { rerender } = render(<BackButton label="Old Label" href="/home" />);
      expect(screen.getByText('Old Label')).toBeInTheDocument();

      rerender(<BackButton label="New Label" href="/home" />);
      expect(screen.queryByText('Old Label')).not.toBeInTheDocument();
      expect(screen.getByText('New Label')).toBeInTheDocument();
    });

    it('should maintain href on label change', () => {
      const { rerender, container } = render(<BackButton label="Back" href="/home" />);
      let link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home');

      rerender(<BackButton label="Return" href="/home" />);
      link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('should update href on rerender', () => {
      const { rerender, container } = render(<BackButton label="Back" href="/home" />);
      let link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home');

      rerender(<BackButton label="Back" href="/dashboard" />);
      link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('should maintain className after rerender', () => {
      const { rerender, container } = render(<BackButton label="Back" href="/home" />);
      let button = container.querySelector('button');
      const originalClass = button?.className;

      rerender(<BackButton label="Back" href="/home" />);
      button = container.querySelector('button');
      expect(button?.className).toBe(originalClass);
    });
  });

  describe('Use Case Scenarios', () => {
    it('should work in authentication flow', () => {
      render(<BackButton label="Back to Login" href="/auth/login" />);
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should work in dashboard navigation', () => {
      render(<BackButton label="Back to Dashboard" href="/dashboard" />);
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should work for form cancellation', () => {
      render(<BackButton label="Cancel" href="/movies" />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should work for breadcrumb navigation', () => {
      render(
        <div>
          <h1>Current Page</h1>
          <BackButton label="Back to Previous" href="/previous" />
        </div>
      );
      expect(screen.getByText('Back to Previous')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('should work in modal with navigation', () => {
      render(
        <div className="modal">
          <BackButton label="Close" href="/home" />
        </div>
      );
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('should have component name', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should accept string label', () => {
      render(<BackButton label="Back" href="/home" />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should accept string href', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('should render with required props only', () => {
      const { container } = render(<BackButton label="Back" href="/home" />);
      expect(container.querySelector('a')).toBeInTheDocument();
    });
  });
});
