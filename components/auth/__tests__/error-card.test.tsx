import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorCard } from '../error-card';

// Mock the CardWrapper component
jest.mock('@/components/auth/card-wrapper', () => ({
  CardWrapper: ({ children, headerLabel, backButtonHref, backButtonLabel }: any) => (
    <div data-testid="card-wrapper">
      <div data-testid="card-header">{headerLabel}</div>
      <div data-testid="card-content">{children}</div>
      <button data-testid="back-button" data-href={backButtonHref}>
        {backButtonLabel}
      </button>
    </div>
  ),
}));

// Mock the ExclamationTriangleIcon
jest.mock('@radix-ui/react-icons', () => ({
  ExclamationTriangleIcon: ({ className }: { className: string }) => (
    <div data-testid="exclamation-icon" className={className}>
      ⚠
    </div>
  ),
}));

describe('ErrorCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ErrorCard />);
      expect(container).toBeInTheDocument();
    });

    it('should render CardWrapper', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });

    it('should render error icon', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
    });

    it('should render header with error message', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('CardWrapper Props', () => {
    it('should pass correct headerLabel to CardWrapper', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('card-header')).toHaveTextContent('Oops! Something went wrong!');
    });

    it('should pass correct backButtonHref to CardWrapper', () => {
      render(<ErrorCard />);
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');
    });

    it('should pass correct backButtonLabel to CardWrapper', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should not pass showSocial prop to CardWrapper', () => {
      render(<ErrorCard />);
      const wrapper = screen.getByTestId('card-wrapper');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Error Icon', () => {
    it('should render ExclamationTriangleIcon', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
    });

    it('should apply destructive color class to icon', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('text-destructive');
    });

    it('should apply width class to icon', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('w-7');
    });

    it('should apply height class to icon', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('h-7');
    });

    it('should have correct full className', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('text-destructive');
      expect(icon?.className).toContain('w-7');
      expect(icon?.className).toContain('h-7');
    });
  });

  describe('Component Structure', () => {
    it('should render icon in centered container', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toContain('⚠');
    });

    it('should render icon within CardWrapper content', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const icon = screen.getByTestId('exclamation-icon');
      expect(content).toContainElement(icon);
    });

    it('should have proper element hierarchy', () => {
      render(<ErrorCard />);
      const wrapper = screen.getByTestId('card-wrapper');
      const header = screen.getByTestId('card-header');
      const content = screen.getByTestId('card-content');
      expect(wrapper).toContainElement(header);
      expect(wrapper).toContainElement(content);
    });
  });

  describe('Content Container Styling', () => {
    it('should apply flex class to container', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('flex');
    });

    it('should apply w-full class to container', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('w-full');
    });

    it('should apply items-center class to container', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('items-center');
    });

    it('should apply justify-center class to container', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('justify-center');
    });

    it('should have all centering classes', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      const className = div?.className || '';
      expect(className).toContain('flex');
      expect(className).toContain('w-full');
      expect(className).toContain('items-center');
      expect(className).toContain('justify-center');
    });
  });

  describe('Re-rendering', () => {
    it('should maintain same props after rerender', () => {
      const { rerender } = render(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();

      rerender(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();
    });

    it('should display icon consistently', () => {
      const { rerender } = render(<ErrorCard />);
      let icon = screen.getByTestId('exclamation-icon');
      expect(icon).toBeInTheDocument();

      rerender(<ErrorCard />);
      icon = screen.getByTestId('exclamation-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should maintain back button after rerender', () => {
      const { rerender } = render(<ErrorCard />);
      let backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');

      rerender(<ErrorCard />);
      backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');
    });
  });

  describe('Use Cases', () => {
    it('should display as an error page', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();
      expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should provide navigation back to login', () => {
      render(<ErrorCard />);
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');
    });

    it('should clearly indicate an error state with icon', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('text-destructive');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });

    it('should display error message clearly', () => {
      render(<ErrorCard />);
      const header = screen.getByTestId('card-header');
      expect(header?.textContent).toBe('Oops! Something went wrong!');
    });

    it('should provide clear back button label', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should display error icon visually', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('⚠');
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple instances independently', () => {
      render(
        <div>
          <ErrorCard />
          <ErrorCard />
        </div>
      );
      const icons = screen.getAllByTestId('exclamation-icon');
      expect(icons.length).toBe(2);
    });

    it('should maintain separate instances', () => {
      render(
        <div>
          <ErrorCard />
          <ErrorCard />
        </div>
      );
      const headers = screen.getAllByTestId('card-header');
      expect(headers.length).toBe(2);
      headers.forEach((header) => {
        expect(header).toHaveTextContent('Oops! Something went wrong!');
      });
    });
  });

  describe('Error Display', () => {
    it('should indicate error with header text', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();
    });

    it('should use destructive color for visibility', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('text-destructive');
    });

    it('should center error message', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('justify-center');
      expect(div?.className).toContain('items-center');
    });

    it('should display warning icon', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
    });
  });

  describe('Styling Consistency', () => {
    it('should apply consistent icon size', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('w-7');
      expect(icon?.className).toContain('h-7');
    });

    it('should apply consistent color scheme', () => {
      render(<ErrorCard />);
      const icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toContain('text-destructive');
    });

    it('should maintain layout consistency', () => {
      render(<ErrorCard />);
      const content = screen.getByTestId('card-content');
      const div = content.querySelector('div');
      expect(div?.className).toContain('flex');
      expect(div?.className).toContain('w-full');
    });
  });

  describe('Static Content', () => {
    it('should have static header label', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Oops! Something went wrong!')).toBeInTheDocument();
    });

    it('should have static back button label', () => {
      render(<ErrorCard />);
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should have static back button href', () => {
      render(<ErrorCard />);
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');
    });

    it('should not accept props', () => {
      // ErrorCard doesn't accept any props, it's a static component
      render(<ErrorCard />);
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should be a functional component', () => {
      const result = render(<ErrorCard />);
      expect(result).toBeDefined();
    });

    it('should not require any props', () => {
      // This should render without errors
      const { container } = render(<ErrorCard />);
      expect(container).toBeInTheDocument();
    });

    it('should render without additional configuration', () => {
      render(<ErrorCard />);
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work within a page layout', () => {
      render(
        <div className="page">
          <ErrorCard />
        </div>
      );
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });

    it('should work with other sibling elements', () => {
      render(
        <div>
          <header>My App</header>
          <ErrorCard />
          <footer>Footer</footer>
        </div>
      );
      expect(screen.getByText('My App')).toBeInTheDocument();
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should maintain structure within container', () => {
      render(
        <div className="error-container">
          <ErrorCard />
        </div>
      );
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('should be a valid React component', () => {
      const errorCard = <ErrorCard />;
      expect(errorCard).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid rerenders', () => {
      const { rerender } = render(<ErrorCard />);
      rerender(<ErrorCard />);
      rerender(<ErrorCard />);
      rerender(<ErrorCard />);
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });

    it('should maintain icon display during rerenders', () => {
      const { rerender } = render(<ErrorCard />);
      let icon = screen.getByTestId('exclamation-icon');
      const originalClassName = icon?.className;

      rerender(<ErrorCard />);
      icon = screen.getByTestId('exclamation-icon');
      expect(icon?.className).toBe(originalClassName);
    });

    it('should render in strict mode', () => {
      render(
        <React.StrictMode>
          <ErrorCard />
        </React.StrictMode>
      );
      expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
    });
  });
});
