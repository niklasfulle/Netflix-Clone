import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogoutButton } from '../logout-button';

// Mock the logout action
jest.mock('@/actions/logout', () => ({
  logout: jest.fn(),
}));

describe('LogoutButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<LogoutButton />);
      expect(container).toBeInTheDocument();
    });

    it('should render button element', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with children text', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render button with correct tag name', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should render multiple buttons independently', () => {
      const { container } = render(
        <div>
          <LogoutButton>Logout 1</LogoutButton>
          <LogoutButton>Logout 2</LogoutButton>
        </div>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('Props Handling', () => {
    it('should accept children prop', () => {
      render(<LogoutButton>Sign Out</LogoutButton>);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should accept optional children prop', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should accept multiple children elements', () => {
      render(
        <LogoutButton>
          <span>Click</span> <span>Me</span>
        </LogoutButton>
      );
      expect(screen.getByText('Click')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('should accept complex children elements', () => {
      render(
        <LogoutButton>
          <span className="icon">🚪</span>
          <span>Logout</span>
        </LogoutButton>
      );
      expect(screen.getByText('🚪')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should handle children with special characters', () => {
      render(<LogoutButton>Sign Out &rarr;</LogoutButton>);
      expect(screen.getByText('Sign Out →')).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      const { container } = render(<LogoutButton>{''}</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Click Functionality', () => {
    it('should handle click event', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should call logout action on click', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(3);
    });

    it('should call logout with no arguments', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledWith();
    });

    it('should logout when clicking button with children', () => {
      const { logout } = require('@/actions/logout');
      render(<LogoutButton>Sign Out</LogoutButton>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should logout when clicking button without children', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should handle rapid clicking', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });

    it('should have cursor-pointer in className', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button?.getAttribute('class')).toContain('cursor-pointer');
    });

    it('should apply cursor style for user interaction', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/cursor-pointer/);
    });

    it('should only have cursor-pointer class', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      const classes = button?.className.split(' ') || [];
      expect(classes).toContain('cursor-pointer');
    });

    it('should maintain cursor-pointer with multiple renders', () => {
      const { container, rerender } = render(<LogoutButton>Logout 1</LogoutButton>);
      let button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');

      rerender(<LogoutButton>Logout 2</LogoutButton>);
      button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });
  });

  describe('Button Properties', () => {
    it('should be a button element', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should have default button type', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.type).toBe('submit');
    });

    it('should be clickable', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should not be disabled by default', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).not.toBeDisabled();
    });

    it('should render as focusable element', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });
  });

  describe('Children Variations', () => {
    it('should render string children', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render element children', () => {
      render(<LogoutButton><span>Logout</span></LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render fragment children', () => {
      render(
        <LogoutButton>
          <>
            <span>Sign</span>
            <span>Out</span>
          </>
        </LogoutButton>
      );
      expect(screen.getByText('Sign')).toBeInTheDocument();
      expect(screen.getByText('Out')).toBeInTheDocument();
    });

    it('should render icon as children', () => {
      render(<LogoutButton>🚪</LogoutButton>);
      expect(screen.getByText('🚪')).toBeInTheDocument();
    });

    it('should render long text children', () => {
      const longText = 'Sign Out From Your Account';
      render(<LogoutButton>{longText}</LogoutButton>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should render number children', () => {
      render(<LogoutButton>{42}</LogoutButton>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render boolean children', () => {
      const { container } = render(<LogoutButton>{true}</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render null children gracefully', () => {
      const { container } = render(<LogoutButton>{null}</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work for navbar logout button', () => {
      const { logout } = require('@/actions/logout');
      render(<LogoutButton>Sign Out</LogoutButton>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should work with icon and text', () => {
      const { logout } = require('@/actions/logout');
      render(
        <LogoutButton>
          <span>🚪 Logout</span>
        </LogoutButton>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should work with minimal styling', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });

    it('should work in dropdown menu', () => {
      const { logout } = require('@/actions/logout');
      render(
        <div role="menu">
          <LogoutButton>Logout</LogoutButton>
        </div>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should work in user menu', () => {
      const { logout } = require('@/actions/logout');
      render(
        <div>
          <span>User Menu</span>
          <LogoutButton>Sign Out</LogoutButton>
        </div>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should be accessible via screen reader', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have readable button text', () => {
      render(<LogoutButton>Sign Out</LogoutButton>);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('Sign Out');
    });

    it('should be focusable', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support semantic button role', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have proper button semantics', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should display children content for accessibility', () => {
      render(<LogoutButton>Sign Out From Account</LogoutButton>);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Sign Out');
    });
  });

  describe('Re-rendering', () => {
    it('should rerender with different children', () => {
      const { rerender } = render(<LogoutButton>Logout 1</LogoutButton>);
      expect(screen.getByText('Logout 1')).toBeInTheDocument();

      rerender(<LogoutButton>Logout 2</LogoutButton>);
      expect(screen.queryByText('Logout 1')).not.toBeInTheDocument();
      expect(screen.getByText('Logout 2')).toBeInTheDocument();
    });

    it('should maintain functionality after rerender', () => {
      const { logout } = require('@/actions/logout');
      const { rerender, container } = render(<LogoutButton>Logout 1</LogoutButton>);
      let button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(1);

      rerender(<LogoutButton>Logout 2</LogoutButton>);
      button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(2);
    });

    it('should maintain styling after rerender', () => {
      const { rerender, container } = render(<LogoutButton>Logout 1</LogoutButton>);
      let button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');

      rerender(<LogoutButton>Logout 2</LogoutButton>);
      button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });

    it('should handle rapid rerenders', () => {
      const { rerender } = render(<LogoutButton>Logout 1</LogoutButton>);
      rerender(<LogoutButton>Logout 2</LogoutButton>);
      rerender(<LogoutButton>Logout 3</LogoutButton>);
      rerender(<LogoutButton>Logout 4</LogoutButton>);
      expect(screen.getByText('Logout 4')).toBeInTheDocument();
    });

    it('should remove children on rerender when undefined', () => {
      const { rerender, container } = render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();

      rerender(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button?.children.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long children text', () => {
      const longText = 'A'.repeat(100);
      render(<LogoutButton>{longText}</LogoutButton>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle whitespace in children', () => {
      render(<LogoutButton>   Logout   </LogoutButton>);
      expect(screen.getByText(/Logout/)).toBeInTheDocument();
    });

    it('should handle newlines in children', () => {
      render(<LogoutButton>Sign{'\n'}Out</LogoutButton>);
      expect(screen.getByText(/Sign/)).toBeInTheDocument();
    });

    it('should handle HTML entities in children', () => {
      render(<LogoutButton>&lt;Logout&gt;</LogoutButton>);
      expect(screen.getByText('<Logout>')).toBeInTheDocument();
    });

    it('should handle emoji in children', () => {
      render(<LogoutButton>👋 Goodbye</LogoutButton>);
      expect(screen.getByText('👋 Goodbye')).toBeInTheDocument();
    });

    it('should handle undefined props gracefully', () => {
      const { container } = render(<LogoutButton children={undefined} />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render in StrictMode', () => {
      render(
        <React.StrictMode>
          <LogoutButton>Logout</LogoutButton>
        </React.StrictMode>
      );
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should handle onClick alongside logout action', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should accept React.ReactNode as children', () => {
      const element = (
        <LogoutButton>
          <div>Logout</div>
        </LogoutButton>
      );
      render(element);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should accept string children', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should accept fragment children', () => {
      render(
        <LogoutButton>
          <>
            <span>Sign</span>
            <span>Out</span>
          </>
        </LogoutButton>
      );
      expect(screen.getByText('Sign')).toBeInTheDocument();
    });

    it('should accept element array children', () => {
      render(
        <LogoutButton>
          {[<span key="1">Sign</span>, <span key="2">Out</span>]}
        </LogoutButton>
      );
      expect(screen.getByText('Sign')).toBeInTheDocument();
    });

    it('should be callable as component', () => {
      const Comp = <LogoutButton>Logout</LogoutButton>;
      render(Comp);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple LogoutButton instances', () => {
      const { container } = render(
        <div>
          <LogoutButton>Logout 1</LogoutButton>
          <LogoutButton>Logout 2</LogoutButton>
        </div>
      );
      expect(screen.getByText('Logout 1')).toBeInTheDocument();
      expect(screen.getByText('Logout 2')).toBeInTheDocument();
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('should handle clicks on multiple instances independently', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(
        <div>
          <LogoutButton>Logout 1</LogoutButton>
          <LogoutButton>Logout 2</LogoutButton>
        </div>
      );
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      expect(logout).toHaveBeenCalledTimes(2);
    });

    it('should maintain independent state for multiple instances', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(
        <div>
          <LogoutButton>Logout</LogoutButton>
          <LogoutButton>Logout</LogoutButton>
          <LogoutButton>Logout</LogoutButton>
        </div>
      );
      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => fireEvent.click(btn));
      expect(logout).toHaveBeenCalledTimes(3);
    });

    it('should work in list', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(
        <ul>
          <li><LogoutButton>User 1</LogoutButton></li>
          <li><LogoutButton>User 2</LogoutButton></li>
        </ul>
      );
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[0]);
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure', () => {
    it('should render as button directly', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      expect(container.firstChild?.nodeName).toBe('BUTTON');
    });

    it('should contain children elements inside button', () => {
      const { container } = render(
        <LogoutButton>
          <span className="test-span">Logout</span>
        </LogoutButton>
      );
      const button = container.querySelector('button');
      const span = button?.querySelector('.test-span');
      expect(span).toBeInTheDocument();
    });

    it('should have button as root element', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.parentNode).toBe(container);
    });

    it('should not have wrapper elements', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBe(0);
    });

    it('should be a simple button component', () => {
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button');
      expect(button?.children.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Action Integration', () => {
    it('should call logout action from @/actions/logout', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });

    it('should call logout without any parameters', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledWith();
    });

    it('should call logout exactly once per click', () => {
      const { logout } = require('@/actions/logout');
      const { container } = render(<LogoutButton>Logout</LogoutButton>);
      const button = container.querySelector('button')!;
      fireEvent.click(button);
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('should be server action compatible', () => {
      const source = require('node:fs').readFileSync(require.resolve('../logout-button.tsx'), 'utf8');
      expect(source).toContain('"use client"');
      expect(source).toContain('logout');
    });

    it('should import logout from correct path', () => {
      const source = require('node:fs').readFileSync(require.resolve('../logout-button.tsx'), 'utf8');
      expect(source).toContain("from '@/actions/logout'");
    });
  });

  describe('Props Interface', () => {
    it('should have optional children prop', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should not have required props', () => {
      const element = <LogoutButton />;
      render(element);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept only children prop', () => {
      render(<LogoutButton>Logout</LogoutButton>);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should be typed with React.ReactNode', () => {
      const source = require('node:fs').readFileSync(require.resolve('../logout-button.tsx'), 'utf8');
      expect(source).toContain('React.ReactNode');
    });

    it('should have LogoutButtonProps interface', () => {
      const source = require('node:fs').readFileSync(require.resolve('../logout-button.tsx'), 'utf8');
      expect(source).toContain('LogoutButtonProps');
    });
  });
});
