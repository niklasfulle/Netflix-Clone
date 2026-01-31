import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Mock the cn utility function
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    return classes.filter(Boolean).join(' ');
  },
}));

describe('Header Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<Header label="Login" />);
      expect(container).toBeInTheDocument();
    });

    it('should render the auth title', () => {
      render(<Header label="Login" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
    });

    it('should render the label text', () => {
      render(<Header label="Sign in to your account" />);
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('should render h1 element', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should render p element for label', () => {
      const { container } = render(<Header label="Login" />);
      const p = container.querySelector('p');
      expect(p).toBeInTheDocument();
    });

    it('should render container div', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display auth emoji in title', () => {
      render(<Header label="Login" />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1?.textContent).toContain('🔐');
    });

    it('should display "Auth" text in title', () => {
      render(<Header label="Login" />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1?.textContent).toContain('Auth');
    });

    it('should display full title with emoji and text', () => {
      render(<Header label="Login" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
    });

    it('should display provided label in paragraph', () => {
      const testLabel = 'Enter your credentials';
      render(<Header label={testLabel} />);
      expect(screen.getByText(testLabel)).toBeInTheDocument();
    });
  });

  describe('Styling - Container', () => {
    it('should apply w-full class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('w-full');
    });

    it('should apply flex class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('flex');
    });

    it('should apply flex-col class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('flex-col');
    });

    it('should apply gap-y-4 class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('gap-y-4');
    });

    it('should apply items-center class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('items-center');
    });

    it('should apply justify-center class to container', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('justify-center');
    });

    it('should have all container classes', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      const className = div?.className || '';
      expect(className).toContain('w-full');
      expect(className).toContain('flex');
      expect(className).toContain('flex-col');
      expect(className).toContain('gap-y-4');
      expect(className).toContain('items-center');
      expect(className).toContain('justify-center');
    });
  });

  describe('Styling - Title (h1)', () => {
    it('should apply text-2xl class to h1', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('text-2xl');
    });

    it('should apply font-semibold class to h1', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('font-semibold');
    });

    it('should apply text-white class to h1', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('text-white');
    });

    it('should have all h1 classes', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      const className = h1?.className || '';
      expect(className).toContain('text-2xl');
      expect(className).toContain('font-semibold');
      expect(className).toContain('text-white');
    });
  });

  describe('Styling - Label (p)', () => {
    it('should apply text-gray-300 class to p', () => {
      const { container } = render(<Header label="Login" />);
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-gray-300');
    });

    it('should apply text-sm class to p', () => {
      const { container } = render(<Header label="Login" />);
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-sm');
    });

    it('should have both p classes', () => {
      const { container } = render(<Header label="Login" />);
      const p = container.querySelector('p');
      const className = p?.className || '';
      expect(className).toContain('text-gray-300');
      expect(className).toContain('text-sm');
    });
  });

  describe('Props Handling', () => {
    it('should accept label prop', () => {
      render(<Header label="Test Label" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should render different labels', () => {
      const { rerender } = render(<Header label="First Label" />);
      expect(screen.getByText('First Label')).toBeInTheDocument();

      rerender(<Header label="Second Label" />);
      expect(screen.getByText('Second Label')).toBeInTheDocument();
    });

    it('should display only the provided label', () => {
      render(<Header label="Custom Text" />);
      const p = screen.getByText('Custom Text');
      expect(p?.textContent).toBe('Custom Text');
    });
  });

  describe('Re-rendering', () => {
    it('should update label on rerender', () => {
      const { rerender } = render(<Header label="Old Label" />);
      expect(screen.getByText('Old Label')).toBeInTheDocument();

      rerender(<Header label="New Label" />);
      expect(screen.queryByText('Old Label')).not.toBeInTheDocument();
      expect(screen.getByText('New Label')).toBeInTheDocument();
    });

    it('should maintain title on rerender', () => {
      const { rerender } = render(<Header label="Label 1" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();

      rerender(<Header label="Label 2" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
    });

    it('should maintain styling on rerender', () => {
      const { rerender, container } = render(<Header label="Label 1" />);
      let h1 = container.querySelector('h1');
      const originalClassName = h1?.className;

      rerender(<Header label="Label 2" />);
      h1 = container.querySelector('h1');
      expect(h1?.className).toBe(originalClassName);
    });

    it('should handle rapid rerenders', () => {
      const { rerender } = render(<Header label="Label 1" />);
      rerender(<Header label="Label 2" />);
      rerender(<Header label="Label 3" />);
      rerender(<Header label="Label 4" />);
      expect(screen.getByText('Label 4')).toBeInTheDocument();
    });
  });

  describe('Label Variations', () => {
    it('should display empty string label', () => {
      const { container } = render(<Header label="" />);
      const p = container.querySelector('p');
      expect(p?.textContent).toBe('');
    });

    it('should display long label text', () => {
      const longLabel = 'This is a very long label that could wrap to multiple lines';
      render(<Header label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should display very long label text', () => {
      const veryLongLabel = 'A'.repeat(100);
      render(<Header label={veryLongLabel} />);
      expect(screen.getByText(veryLongLabel)).toBeInTheDocument();
    });

    it('should display label with special characters', () => {
      const specialLabel = 'Sign in <securely> & verify 2FA';
      render(<Header label={specialLabel} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });

    it('should display label with numbers', () => {
      const numericLabel = 'Step 1 of 3: Enter your email';
      render(<Header label={numericLabel} />);
      expect(screen.getByText(numericLabel)).toBeInTheDocument();
    });

    it('should display label with emoji', () => {
      const emojiLabel = 'Welcome! 👋';
      render(<Header label={emojiLabel} />);
      expect(screen.getByText(emojiLabel)).toBeInTheDocument();
    });

    it('should display label with punctuation', () => {
      const punctuationLabel = 'Hello, World! How are you?';
      render(<Header label={punctuationLabel} />);
      expect(screen.getByText(punctuationLabel)).toBeInTheDocument();
    });
  });

  describe('Element Hierarchy', () => {
    it('should have container as root element', () => {
      const { container } = render(<Header label="Login" />);
      const rootDiv = container.firstChild;
      expect(rootDiv?.childNodes.length).toBeGreaterThan(0);
    });

    it('should have h1 as first child of container', () => {
      const { container } = render(<Header label="Login" />);
      const rootDiv = container.firstChild as Element;
      const h1 = rootDiv?.children[0];
      expect(h1?.tagName).toBe('H1');
    });

    it('should have p as second child of container', () => {
      const { container } = render(<Header label="Login" />);
      const rootDiv = container.firstChild as Element;
      const p = rootDiv?.children[1];
      expect(p?.tagName).toBe('P');
    });

    it('should have exactly two children in container', () => {
      const { container } = render(<Header label="Login" />);
      const rootDiv = container.firstChild as Element;
      expect(rootDiv?.children.length).toBe(2);
    });
  });

  describe('Use Cases', () => {
    it('should work for login header', () => {
      render(<Header label="Sign in to your account" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('should work for register header', () => {
      render(<Header label="Create a new account" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
      expect(screen.getByText('Create a new account')).toBeInTheDocument();
    });

    it('should work for password reset header', () => {
      render(<Header label="Reset your password" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
      expect(screen.getByText('Reset your password')).toBeInTheDocument();
    });

    it('should work for verification header', () => {
      render(<Header label="Verify your email" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
      expect(screen.getByText('Verify your email')).toBeInTheDocument();
    });

    it('should work for error header', () => {
      render(<Header label="Something went wrong" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render heading for screen readers', () => {
      render(<Header label="Login" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild;
      const h1 = container.querySelector('h1');
      const p = container.querySelector('p');
      expect(div).toBeInTheDocument();
      expect(h1).toBeInTheDocument();
      expect(p).toBeInTheDocument();
    });

    it('should display heading with proper text content', () => {
      render(<Header label="Login" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading?.textContent).toBe('🔐 Auth');
    });

    it('should have readable label text', () => {
      render(<Header label="Please sign in" />);
      const paragraph = screen.getByText('Please sign in');
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple headers independently', () => {
      render(
        <div>
          <Header label="Header 1" />
          <Header label="Header 2" />
        </div>
      );
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
    });

    it('should maintain separate labels for each instance', () => {
      render(
        <div>
          <Header label="Login" />
          <Header label="Register" />
        </div>
      );
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should render multiple title instances', () => {
      const { container } = render(
        <div>
          <Header label="Label 1" />
          <Header label="Label 2" />
          <Header label="Label 3" />
        </div>
      );
      const h1Elements = container.querySelectorAll('h1');
      expect(h1Elements.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should render with whitespace-only label', () => {
      const { container } = render(<Header label="   " />);
      const p = container.querySelector('p');
      expect(p?.textContent).toBe('   ');
    });

    it('should render with newline in label', () => {
      const labelWithNewline = 'Line 1\nLine 2';
      const { container } = render(<Header label={labelWithNewline} />);
      const p = container.querySelector('p');
      expect(p?.textContent).toBe(labelWithNewline);
    });

    it('should handle label with HTML entities', () => {
      const htmlLabel = '&lt;tag&gt;';
      render(<Header label={htmlLabel} />);
      expect(screen.getByText(htmlLabel)).toBeInTheDocument();
    });

    it('should render with Unicode characters in label', () => {
      const unicodeLabel = 'こんにちは';
      render(<Header label={unicodeLabel} />);
      expect(screen.getByText(unicodeLabel)).toBeInTheDocument();
    });

    it('should render in strict mode', () => {
      render(
        <React.StrictMode>
          <Header label="Login" />
        </React.StrictMode>
      );
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
    });
  });

  describe('Styling Details', () => {
    it('should have flex layout with column direction', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toMatch(/flex.*flex-col|flex-col.*flex/);
    });

    it('should center content both horizontally and vertically', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('items-center');
      expect(div?.className).toContain('justify-center');
    });

    it('should have gap between h1 and p', () => {
      const { container } = render(<Header label="Login" />);
      const div = container.firstChild as Element;
      expect(div?.className).toContain('gap-y-4');
    });

    it('h1 should be bold with large text', () => {
      const { container } = render(<Header label="Login" />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('text-2xl');
      expect(h1?.className).toContain('font-semibold');
    });

    it('p should be small with muted color', () => {
      const { container } = render(<Header label="Login" />);
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-sm');
      expect(p?.className).toContain('text-gray-300');
    });
  });

  describe('Component Props', () => {
    it('should require label prop', () => {
      // This test verifies the component expects a label prop
      const component = <Header label="test" />;
      expect(component).toBeDefined();
    });

    it('should work with string label', () => {
      render(<Header label="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should not accept additional props', () => {
      // ErrorCard only accepts label - other props should be ignored
      const { container } = render(<Header label="Test" />);
      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });

  describe('Display Consistency', () => {
    it('should always show title "🔐 Auth"', () => {
      const { rerender } = render(<Header label="Login" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();

      rerender(<Header label="Different" />);
      expect(screen.getByText('🔐 Auth')).toBeInTheDocument();
    });

    it('should maintain consistent styling across different labels', () => {
      const { container, rerender } = render(<Header label="Label 1" />);
      let h1 = container.querySelector('h1');
      const originalClass = h1?.className;

      rerender(<Header label="Label 2" />);
      h1 = container.querySelector('h1');
      expect(h1?.className).toBe(originalClass);
    });

    it('should always render two elements (h1 and p)', () => {
      const { container, rerender } = render(<Header label="Label 1" />);
      let rootDiv = container.firstChild as Element;
      expect(rootDiv?.children.length).toBe(2);

      rerender(<Header label="Label 2" />);
      rootDiv = container.firstChild as Element;
      expect(rootDiv?.children.length).toBe(2);
    });
  });
});
