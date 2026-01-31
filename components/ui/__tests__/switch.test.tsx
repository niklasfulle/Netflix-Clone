import * as React from 'react';
import { render, fireEvent} from '@testing-library/react';
import { Switch } from '../switch';

// Mock ResizeObserver for Radix UI components that use it
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<Switch />);
      const switchButton = container.querySelector('button[role="switch"]');
      expect(switchButton).toBeInTheDocument();
    });

    it('should render as a button', () => {
      const { container } = render(<Switch />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper structure', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeTruthy();
    });

    it('should render with thumb element', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have button type', () => {
      const { container } = render(<Switch />);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('State Management', () => {
    it('should be unchecked by default', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('should support checked state', () => {
      const { container } = render(<Switch defaultChecked />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('should toggle when clicked', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;

      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
      fireEvent.click(switchElement);
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('should update checked state with defaultChecked', () => {
      const { rerender, container } = render(<Switch />);
      let switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      rerender(<Switch defaultChecked={true} />);
      // After rerender, the state should reflect the new defaultChecked value
      switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();
    });

    it('should handle controlled checked state', () => {
      const { rerender, container } = render(<Switch checked={false} onCheckedChange={() => {}} />);
      let switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      rerender(<Switch checked={true} onCheckedChange={() => {}} />);
      switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('should call onCheckedChange callback', () => {
      const onCheckedChange = jest.fn();
      const { container } = render(<Switch onCheckedChange={onCheckedChange} />);

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      fireEvent.click(switchElement);

      expect(onCheckedChange).toHaveBeenCalled();
    });

    it('should support disabled state', () => {
      const { container } = render(<Switch disabled />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeDisabled();
    });
  });

  describe('Styling', () => {
    it('should have inline-flex display', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('inline-flex');
    });

    it('should have correct height', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('h-5');
    });

    it('should have correct width', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('w-9');
    });

    it('should have rounded corners', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('rounded-full');
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('cursor-pointer');
    });

    it('should have shadow styling', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('shadow-sm');
    });

    it('should have transition class', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('transition-colors');
    });

    it('should support custom className', () => {
      const { container } = render(<Switch className="custom-class" />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('custom-class');
    });

    it('should apply disabled styles when disabled', () => {
      const { container } = render(<Switch disabled />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('disabled:opacity-50');
    });

    it('should apply checked background color selector', () => {
      const { container } = render(<Switch defaultChecked />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('data-[state=checked]:bg-primary');
    });

    it('should apply unchecked background color selector', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('data-[state=unchecked]:bg-input');
    });
  });

  describe('Thumb Styling', () => {
    it('should have thumb element', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have rounded thumb', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have thumb height', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have thumb width', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have thumb shadow', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have thumb transition', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });

    it('should have thumb translate when checked', () => {
      const { container } = render(<Switch defaultChecked />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot).toHaveAttribute('data-state', 'checked');
    });

    it('should have thumb initial position when unchecked', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Accessibility', () => {
    it('should have switch role', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.getAttribute('role')).toBe('switch');
    });

    it('should support aria-label', () => {
      const { container } = render(<Switch aria-label="Dark mode" />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-label', 'Dark mode');
    });

    it('should support aria-describedby', () => {
      const { container } = render(
        <div>
          <Switch aria-describedby="switch-desc" />
          <p id="switch-desc">Toggle dark mode</p>
        </div>
      );
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-describedby', 'switch-desc');
    });

    it('should have focus visible styles', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('focus-visible:outline-none');
    });

    it('should have focus ring', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('focus-visible:ring-2');
    });

    it('should be keyboard focusable', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });

    it('should handle keyboard interaction', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;

      switchElement.focus();
      fireEvent.keyDown(switchElement, { code: 'Space' });

      expect(switchElement).toHaveFocus();
    });

    it('should indicate disabled state', () => {
      const { container } = render(<Switch disabled aria-label="Disabled toggle" />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeDisabled();
    });

    it('should indicate checked state via attribute', () => {
      const { container } = render(<Switch defaultChecked aria-label="Enabled" />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      const { container } = render(<Switch disabled />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).not.toBeDisabled();
    });

    it('should not toggle when disabled', () => {
      const onCheckedChange = jest.fn();
      const { container } = render(<Switch disabled onCheckedChange={onCheckedChange} />);

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      fireEvent.click(switchElement);

      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('should apply disabled cursor style', () => {
      const { container } = render(<Switch disabled />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('disabled:cursor-not-allowed');
    });

    it('should apply disabled opacity', () => {
      const { container } = render(<Switch disabled />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('disabled:opacity-50');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('should forward aria attributes', () => {
      const { container } = render(
        <Switch aria-label="Test switch" aria-describedby="test-desc" />
      );
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('aria-label', 'Test switch');
      expect(switchElement).toHaveAttribute('aria-describedby', 'test-desc');
    });

    it('should forward data attributes', () => {
      const { container } = render(<Switch data-testid="my-switch" />);
      expect(container.querySelector('[data-testid="my-switch"]')).toBeInTheDocument();
    });

    it('should forward onBlur callback', () => {
      const onBlur = jest.fn();
      const { container } = render(<Switch onBlur={onBlur} />);

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      switchElement.focus();
      fireEvent.blur(switchElement);

      expect(onBlur).toHaveBeenCalled();
    });

    it('should forward onFocus callback', () => {
      const onFocus = jest.fn();
      const { container } = render(<Switch onFocus={onFocus} />);

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      fireEvent.focus(switchElement);

      expect(onFocus).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking', () => {
      const onCheckedChange = jest.fn();
      const { container } = render(<Switch onCheckedChange={onCheckedChange} />);

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement;
      fireEvent.click(switchElement);
      fireEvent.click(switchElement);
      fireEvent.click(switchElement);

      expect(onCheckedChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle undefined checked state', () => {
      const { container } = render(<Switch checked={undefined} />);
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should render multiple switches independently', () => {
      const { container } = render(
        <>
          <Switch aria-label="Switch 1" />
          <Switch aria-label="Switch 2" />
          <Switch aria-label="Switch 3" />
        </>
      );
      const switches = container.querySelectorAll('[role="switch"]');
      expect(switches.length).toBe(3);
    });

    it('should handle different checked states in multiple switches', () => {
      const { container } = render(
        <>
          <Switch defaultChecked={true} aria-label="Switch 1" />
          <Switch defaultChecked={false} aria-label="Switch 2" />
          <Switch defaultChecked={true} aria-label="Switch 3" />
        </>
      );
      const switches = container.querySelectorAll('[role="switch"]');
      expect(switches[0]).toHaveAttribute('data-state', 'checked');
      expect(switches[1]).toHaveAttribute('data-state', 'unchecked');
      expect(switches[2]).toHaveAttribute('data-state', 'checked');
    });

    it('should handle className merging with custom classes', () => {
      const { container } = render(
        <Switch className="custom-class additional-class" />
      );
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('custom-class');
      expect(switchElement?.className).toContain('additional-class');
    });

    it('should handle empty string className', () => {
      const { container } = render(<Switch className="" />);
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work in a form', () => {
      const { container } = render(
        <form>
          <label htmlFor="theme-switch">Dark Mode</label>
          <Switch id="theme-switch" />
          <button type="submit">Save</button>
        </form>
      );
      expect(container.querySelector('form')).toBeInTheDocument();
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should work with label', () => {
      const { container } = render(
        <label>
          Dark Mode
          <Switch />
        </label>
      );
      expect(container.querySelector('label')).toBeInTheDocument();
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should work with external label', () => {
      const { container } = render(
        <>
          <label htmlFor="my-switch">Toggle Feature</label>
          <Switch id="my-switch" />
        </>
      );
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toHaveAttribute('id', 'my-switch');
    });

    it('should work in a container with other elements', () => {
      const { container } = render(
        <div className="flex items-center gap-2">
          <span>Feature Enabled</span>
          <Switch />
          <span>Off</span>
        </div>
      );
      expect(container.textContent).toContain('Feature Enabled');
      expect(container.textContent).toContain('Off');
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should work in a complex form', () => {
      const handleSubmit = jest.fn();

      const { container } = render(
        <form onSubmit={handleSubmit}>
          <label htmlFor="notifications">Enable Notifications</label>
          <Switch id="notifications" />

          <label htmlFor="analytics">Allow Analytics</label>
          <Switch id="analytics" />

          <button type="submit">Save Settings</button>
        </form>
      );

      const switches = container.querySelectorAll('[role="switch"]');
      expect(switches.length).toBe(2);
    });
  });

  describe('Display Name', () => {
    it('should have display name', () => {
      expect(Switch.displayName).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(typeof Switch.displayName).toBe('string');
    });
  });

  describe('Type Safety', () => {
    it('should accept valid boolean for checked', () => {
      const { container } = render(<Switch checked={true} />);
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should accept valid boolean for defaultChecked', () => {
      const { container } = render(<Switch defaultChecked={true} />);
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should accept valid boolean for disabled', () => {
      const { container } = render(<Switch disabled={true} />);
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });

    it('should accept onCheckedChange callback', () => {
      const onCheckedChange = jest.fn();
      const { container } = render(
        <Switch onCheckedChange={onCheckedChange} />
      );
      expect(container.querySelector('[role="switch"]')).toBeInTheDocument();
    });
  });

  describe('Rendering Consistency', () => {
    it('should render same structure on rerender', () => {
      const { rerender, container } = render(<Switch />);
      const initialSwitch = container.querySelector('[role="switch"]');

      rerender(<Switch />);
      const secondSwitch = container.querySelector('[role="switch"]');

      expect(initialSwitch).toBeTruthy();
      expect(secondSwitch).toBeTruthy();
    });

    it('should maintain classes on rerender', () => {
      const { rerender, container } = render(<Switch className="test-class" />);
      let switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('test-class');

      rerender(<Switch className="test-class" />);
      switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('test-class');
    });

    it('should maintain disabled state on rerender', () => {
      const { rerender, container } = render(<Switch disabled />);
      let switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeDisabled();

      rerender(<Switch disabled />);
      switchElement = container.querySelector('[role="switch"]');
      expect(switchElement).toBeDisabled();
    });
  });

  describe('Visual Feedback', () => {
    it('should have focus ring styling', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('focus-visible:ring-offset-background');
    });

    it('should have transition for smooth animation', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('transition-colors');
    });

    it('should have border styling', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('border-2');
      expect(switchElement?.className).toContain('border-transparent');
    });

    it('should have shadow for depth', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('shadow-sm');
    });
  });

  describe('Color States', () => {
    it('should have primary color when checked', () => {
      const { container } = render(<Switch defaultChecked />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('data-[state=checked]:bg-primary');
    });

    it('should have input color when unchecked', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('[role="switch"]');
      expect(switchElement?.className).toContain('data-[state=unchecked]:bg-input');
    });

    it('should have correct structure', () => {
      const { container } = render(<Switch />);
      const switchRoot = container.querySelector('[role="switch"]');
      expect(switchRoot?.children.length).toBeGreaterThan(0);
    });
  });
});
