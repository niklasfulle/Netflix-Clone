import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { CardWrapper } from '../card-wrapper';

// Mock the Header component
jest.mock('@/components/auth/header', () => ({
  Header: ({ label }: { label: string }) => <div data-testid="header">{label}</div>,
}));

// Mock the Social component
jest.mock('@/components/auth/social', () => ({
  Social: () => <div data-testid="social">Social</div>,
}));

// Mock the BackButton component
jest.mock('@/components/auth/back-button', () => ({
  BackButton: ({ label, href }: { label: string; href: string }) => (
    <button data-testid="back-button" data-href={href}>
      {label}
    </button>
  ),
}));

// Mock the Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardFooter: ({ children }: any) => (
    <div data-testid="card-footer">{children}</div>
  ),
}));

describe('CardWrapper Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <CardWrapper
          headerLabel="Test Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render Card component', () => {
      render(
        <CardWrapper
          headerLabel="Test Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render CardHeader with Header', () => {
      render(
        <CardWrapper
          headerLabel="Test Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should render CardContent', () => {
      render(
        <CardWrapper
          headerLabel="Test Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should render BackButton', () => {
      render(
        <CardWrapper
          headerLabel="Test Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass headerLabel to Header component', () => {
      render(
        <CardWrapper
          headerLabel="Login"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should pass backButtonLabel to BackButton', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Go Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('should pass backButtonHref to BackButton', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/auth/login"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/auth/login');
    });

    it('should render children content', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>My Custom Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('My Custom Content')).toBeInTheDocument();
    });

    it('should accept multiple children elements', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </CardWrapper>
      );
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });
  });

  describe('Social Component', () => {
    it('should not render Social when showSocial is undefined', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByTestId('social')).not.toBeInTheDocument();
    });

    it('should not render Social when showSocial is false', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={false}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByTestId('social')).not.toBeInTheDocument();
    });

    it('should render Social when showSocial is true', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('social')).toBeInTheDocument();
    });

    it('should render Social in CardFooter when showSocial is true', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      const cardFooters = screen.getAllByTestId('card-footer');
      expect(cardFooters.length).toBeGreaterThan(0);
    });
  });

  describe('Card Styling', () => {
    it('should apply Card className', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card?.className).toContain('w-[400px]');
    });

    it('should apply shadow-md class', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card?.className).toContain('shadow-md');
    });

    it('should apply z-100 class', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card?.className).toContain('z-100');
    });

    it('should apply border-0 class', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card?.className).toContain('border-0');
    });

    it('should apply bg-black/70 class', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card?.className).toContain('bg-black/70');
    });
  });

  describe('Component Structure', () => {
    it('should render Header before Content', () => {
      render(
        <CardWrapper
          headerLabel="Header"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const header = screen.getByTestId('card-header');
      const content = screen.getByTestId('card-content');
      expect(header.compareDocumentPosition(content)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it('should render Content before BackButton', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const content = screen.getByTestId('card-content');
      const backButton = screen.getByTestId('back-button');
      expect(content.compareDocumentPosition(backButton)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it('should render all required sections', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render children in CardContent', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <p>Test Content</p>
        </CardWrapper>
      );
      const content = screen.getByTestId('card-content');
      expect(content.textContent).toContain('Test Content');
    });

    it('should render form elements as children', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <form>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
          </form>
        </CardWrapper>
      );
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('should render component children', () => {
      const TestComponent = () => <div>Test Component</div>;
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <TestComponent />
        </CardWrapper>
      );
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should render conditional content', () => {
      const shouldShowContent = true;
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          {shouldShowContent && <div>Conditional Content</div>}
        </CardWrapper>
      );
      expect(screen.getByText('Conditional Content')).toBeInTheDocument();
    });
  });

  describe('Re-rendering', () => {
    it('should update headerLabel on rerender', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Old Label"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Old Label')).toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="New Label"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByText('Old Label')).not.toBeInTheDocument();
      expect(screen.getByText('New Label')).toBeInTheDocument();
    });

    it('should update backButtonLabel on rerender', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Old Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Old Back')).toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="New Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByText('Old Back')).not.toBeInTheDocument();
      expect(screen.getByText('New Back')).toBeInTheDocument();
    });

    it('should update backButtonHref on rerender', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/old"
        >
          <div>Content</div>
        </CardWrapper>
      );
      let backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/old');

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/new"
        >
          <div>Content</div>
        </CardWrapper>
      );
      backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/new');
    });

    it('should toggle Social visibility on rerender', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={false}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByTestId('social')).not.toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('social')).toBeInTheDocument();
    });

    it('should update children content on rerender', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Old Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Old Content')).toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>New Content</div>
        </CardWrapper>
      );
      expect(screen.queryByText('Old Content')).not.toBeInTheDocument();
      expect(screen.getByText('New Content')).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work for login form', () => {
      render(
        <CardWrapper
          headerLabel="Login"
          backButtonLabel="Back to Home"
          backButtonHref="/"
          showSocial={true}
        >
          <form>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Login</button>
          </form>
        </CardWrapper>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByTestId('social')).toBeInTheDocument();
    });

    it('should work for registration form', () => {
      render(
        <CardWrapper
          headerLabel="Register"
          backButtonLabel="Already have an account? Login"
          backButtonHref="/auth/login"
          showSocial={true}
        >
          <form>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Register</button>
          </form>
        </CardWrapper>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Already have an account? Login')).toBeInTheDocument();
    });

    it('should work for password reset', () => {
      render(
        <CardWrapper
          headerLabel="Reset Password"
          backButtonLabel="Back to Login"
          backButtonHref="/auth/login"
          showSocial={false}
        >
          <form>
            <input type="email" placeholder="Email" />
            <button>Send Reset Link</button>
          </form>
        </CardWrapper>
      );
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.queryByTestId('social')).not.toBeInTheDocument();
    });

    it('should work for error message display', () => {
      render(
        <CardWrapper
          headerLabel="Error"
          backButtonLabel="Go Back"
          backButtonHref="/home"
        >
          <div className="error">Something went wrong</div>
        </CardWrapper>
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should work with verification form', () => {
      render(
        <CardWrapper
          headerLabel="Verify Email"
          backButtonLabel="Back"
          backButtonHref="/auth/login"
        >
          <form>
            <input type="text" placeholder="Verification Code" />
            <button>Verify</button>
          </form>
        </CardWrapper>
      );
      expect(screen.getByText('Verify Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Verification Code')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string labels', () => {
      render(
        <CardWrapper
          headerLabel=""
          backButtonLabel=""
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle very long labels', () => {
      const longLabel = 'A'.repeat(100);
      render(
        <CardWrapper
          headerLabel={longLabel}
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      render(
        <CardWrapper
          headerLabel="Sign & Verify <special>"
          backButtonLabel="← Go Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Sign & Verify <special>')).toBeInTheDocument();
      expect(screen.getByText('← Go Back')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div />
        </CardWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle href with query parameters', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home?page=1&sort=date"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toHaveAttribute('data-href', '/home?page=1&sort=date');
    });

    it('should handle complex nested children', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>
            <section>
              <article>
                <p>Nested Content</p>
              </article>
            </section>
          </div>
        </CardWrapper>
      );
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });

    it('should handle multiple showSocial toggles', () => {
      const { rerender } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('social')).toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={false}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.queryByTestId('social')).not.toBeInTheDocument();

      rerender(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('social')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render Header for page title', () => {
      render(
        <CardWrapper
          headerLabel="Login Page"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should render BackButton for navigation', () => {
      render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Go Back"
          backButtonHref="/previous"
        >
          <div>Content</div>
        </CardWrapper>
      );
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('data-href', '/previous');
    });
  });

  describe('Props Validation', () => {
    it('should accept required props', () => {
      const { container } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept optional showSocial prop', () => {
      const { container } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
          showSocial={true}
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(container).toBeInTheDocument();
    });

    it('should work without showSocial prop', () => {
      const { container } = render(
        <CardWrapper
          headerLabel="Test"
          backButtonLabel="Back"
          backButtonHref="/home"
        >
          <div>Content</div>
        </CardWrapper>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Multiple CardWrapper Instances', () => {
    it('should render multiple instances independently', () => {
      render(
        <div>
          <CardWrapper
            headerLabel="Card 1"
            backButtonLabel="Back 1"
            backButtonHref="/1"
          >
            <div>Content 1</div>
          </CardWrapper>
          <CardWrapper
            headerLabel="Card 2"
            backButtonLabel="Back 2"
            backButtonHref="/2"
          >
            <div>Content 2</div>
          </CardWrapper>
        </div>
      );
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should maintain separate state for each instance', () => {
      render(
        <div>
          <CardWrapper
            headerLabel="Login"
            backButtonLabel="Back"
            backButtonHref="/home"
            showSocial={true}
          >
            <div>Login Content</div>
          </CardWrapper>
          <CardWrapper
            headerLabel="Register"
            backButtonLabel="Back"
            backButtonHref="/home"
            showSocial={false}
          >
            <div>Register Content</div>
          </CardWrapper>
        </div>
      );
      const socialElements = screen.getAllByTestId('social');
      expect(socialElements.length).toBe(1);
    });
  });
});
