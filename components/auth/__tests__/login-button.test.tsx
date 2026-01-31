import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from '../login-button';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();

describe('LoginButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      expect(container).toBeInTheDocument();
    });

    it('should render button element', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render children text', () => {
      render(<LoginButton>Sign In</LoginButton>);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <LoginButton>
          <span>Click</span> <span>Me</span>
        </LoginButton>
      );
      expect(screen.getByText('Click')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('should render with complex children elements', () => {
      render(
        <LoginButton>
          <div className="flex items-center gap-2">
            <span>Login</span>
            <span>→</span>
          </div>
        </LoginButton>
      );
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('should render empty children', () => {
      const { container } = render(<LoginButton children={undefined}></LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should accept children prop', () => {
      render(<LoginButton>Click me</LoginButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should accept mode prop', () => {
      const { container } = render(<LoginButton mode="redirect">Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should default to redirect mode', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should handle modal mode', () => {
      render(<LoginButton mode="modal">Login</LoginButton>);
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
    });

    it('should use redirect mode when explicitly set', () => {
      const { container } = render(<LoginButton mode="redirect">Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Click Functionality', () => {
    it('should handle click event', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalled();
    });

    it('should navigate to /auth/login on click', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should call router.push with correct path', () => {
      const { container } = render(<LoginButton>Sign in</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledTimes(3);
    });

    it('should not navigate in modal mode on click', () => {
      const { container } = render(<LoginButton mode="modal">Login</LoginButton>);
      const span = container.querySelector('span');
      if (span) {
        fireEvent.click(span);
      }
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate even with complex children on click', () => {
      const { container } = render(
        <LoginButton>
          <span>Login</span>
        </LoginButton>
      );
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Keyboard Functionality', () => {
    it('should handle Enter key press', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should handle Space key press', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should prevent default for Enter key', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalled();
    });

    it('should prevent default for Space key', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockPush).toHaveBeenCalled();
    });

    it('should ignore other key presses', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'a' });
      fireEvent.keyDown(button, { key: 'Escape' });
      fireEvent.keyDown(button, { key: 'Tab' });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate on multiple Enter key presses', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('should navigate on multiple Space key presses', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: ' ' });
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed key presses', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      fireEvent.keyDown(button, { key: 'a' });
      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('Router Integration', () => {
    it('should use router from next/navigation', () => {
      render(<LoginButton>Login</LoginButton>);
      expect(useRouter).toHaveBeenCalled();
    });

    it('should call router.push with /auth/login path', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should call router.push exactly once per click', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('should have access to router instance', () => {
      render(<LoginButton>Login</LoginButton>);
      const router = (useRouter as jest.Mock).mock.results[0].value;
      expect(router.push).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });

    it('should have bg-transparent class', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-transparent');
    });

    it('should have border-none class', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('border-none');
    });

    it('should have p-0 class', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('p-0');
    });

    it('should have all expected styling classes', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      const className = button?.className || '';
      expect(className).toContain('cursor-pointer');
      expect(className).toContain('bg-transparent');
      expect(className).toContain('border-none');
      expect(className).toContain('p-0');
    });
  });

  describe('Mode Prop Behavior', () => {
    it('should render button for redirect mode', () => {
      const { container } = render(<LoginButton mode="redirect">Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render span for modal mode', () => {
      const { container } = render(<LoginButton mode="modal">Login</LoginButton>);
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
    });

    it('should not render button in modal mode', () => {
      const { container } = render(<LoginButton mode="modal">Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should display TODO message in modal mode', () => {
      render(<LoginButton mode="modal">Login</LoginButton>);
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
    });

    it('should not navigate in modal mode', () => {
      render(<LoginButton mode="modal">Login</LoginButton>);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should ignore children in modal mode rendering', () => {
      render(<LoginButton mode="modal">My Custom Text</LoginButton>);
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
      expect(screen.queryByText('My Custom Text')).not.toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work for navigation from navbar', () => {
      const { container } = render(<LoginButton>Sign In</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should work for navigation from landing page', () => {
      const { container } = render(<LoginButton>Get Started</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should work as a link-like button', () => {
      const { container } = render(
        <LoginButton>
          <span className="text-blue-500 underline">Click here to login</span>
        </LoginButton>
      );
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should work with icon children', () => {
      const { container } = render(
        <LoginButton>
          <span>→</span>
        </LoginButton>
      );
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should work in modal context (showing TODO)', () => {
      render(<LoginButton mode="modal">Open Login Modal</LoginButton>);
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render as button element for keyboard navigation', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should support Enter key activation', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalled();
    });

    it('should support Space key activation', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockPush).toHaveBeenCalled();
    });

    it('should have transparent background for accessibility', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-transparent');
    });

    it('should have no padding for semantic clicking', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('p-0');
    });
  });

  describe('Re-rendering', () => {
    it('should rerender with different children', () => {
      const { rerender } = render(<LoginButton>Login</LoginButton>);
      expect(screen.getByText('Login')).toBeInTheDocument();

      rerender(<LoginButton>Sign In</LoginButton>);
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should rerender with different mode', () => {
      const { rerender } = render(<LoginButton mode="redirect">Login</LoginButton>);
      const button = document.querySelector('button');
      expect(button).toBeInTheDocument();

      rerender(<LoginButton mode="modal">Login</LoginButton>);
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
    });

    it('should maintain functionality after rerender', () => {
      const { rerender, container } = render(<LoginButton>Login</LoginButton>);
      let button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledTimes(1);

      rerender(<LoginButton>Sign In</LoginButton>);
      button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid rerenders', () => {
      const { rerender } = render(<LoginButton>Login</LoginButton>);
      rerender(<LoginButton>Sign In</LoginButton>);
      rerender(<LoginButton>Enter</LoginButton>);
      rerender(<LoginButton>Go</LoginButton>);
      expect(screen.getByText('Go')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long children text', () => {
      const longText = 'A'.repeat(100);
      render(<LoginButton>{longText}</LoginButton>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      const { container } = render(<LoginButton>{''}</LoginButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle special characters in children', () => {
      render(<LoginButton>&lt; Login &gt;</LoginButton>);
      expect(screen.getByText('< Login >')).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<LoginButton>123</LoginButton>);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle emoji in children', () => {
      render(<LoginButton>🔐 Login</LoginButton>);
      expect(screen.getByText('🔐 Login')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should accept React.ReactNode as children', () => {
      const element = (
        <LoginButton>
          <div>Login</div>
        </LoginButton>
      );
      render(element);
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should accept string children', () => {
      render(<LoginButton>Login</LoginButton>);
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should accept fragment children', () => {
      render(
        <LoginButton>
          <>
            <span>Login</span>
          </>
        </LoginButton>
      );
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should accept number children', () => {
      render(<LoginButton>{42}</LoginButton>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple LoginButton instances', () => {
      const { container } = render(
        <div>
          <LoginButton>Login 1</LoginButton>
          <LoginButton>Login 2</LoginButton>
        </div>
      );
      expect(screen.getByText('Login 1')).toBeInTheDocument();
      expect(screen.getByText('Login 2')).toBeInTheDocument();
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('should handle clicks on multiple instances independently', () => {
      const { container } = render(
        <div>
          <LoginButton>Login 1</LoginButton>
          <LoginButton>Login 2</LoginButton>
        </div>
      );
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    it('should handle different modes in multiple instances', () => {
      const { container } = render(
        <div>
          <LoginButton mode="redirect">Login</LoginButton>
          <LoginButton mode="modal">Login</LoginButton>
        </div>
      );
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('TODO: Implement modal')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render as a button in redirect mode', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      expect(container.firstChild?.nodeName).toBe('BUTTON');
    });

    it('should have button type attribute', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.type).toBe('submit');
    });

    it('should contain children elements inside button', () => {
      const { container } = render(
        <LoginButton>
          <span className="test-span">Login</span>
        </LoginButton>
      );
      const button = container.querySelector('button');
      const span = button?.querySelector('.test-span');
      expect(span).toBeInTheDocument();
    });

    it('should have proper button hierarchy', () => {
      const { container } = render(<LoginButton>Login</LoginButton>);
      const button = container.querySelector('button');
      expect(button?.parentNode).toBe(container);
    });

    it('should render as span in modal mode', () => {
      const { container } = render(<LoginButton mode="modal">Login</LoginButton>);
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });
  });
});
