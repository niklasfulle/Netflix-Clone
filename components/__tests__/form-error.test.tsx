'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormError } from '../form-error';

// Mock the @radix-ui/react-icons ExclamationTriangleIcon
jest.mock('@radix-ui/react-icons', () => ({
  ExclamationTriangleIcon: ({ className, ...props }: { className: string }) => (
    <div data-testid="exclamation-triangle-icon" className={className} {...props} />
  ),
}));

describe('FormError', () => {
  describe('Rendering', () => {
    test('should render when message prop is provided', () => {
      render(<FormError message="Error!" />);
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    test('should not render when message prop is undefined', () => {
      const { container } = render(<FormError message={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when no message prop is provided', () => {
      const { container } = render(<FormError />);
      expect(container.firstChild).toBeNull();
    });

    test('should not display when message is empty string', () => {
      const { container } = render(<FormError message="" />);
      expect(container.firstChild).toBeNull();
    });

    test('should render null explicitly when message is empty', () => {
      const result = render(<FormError message="" />);
      expect(result.container.childNodes.length).toBe(0);
    });

    test('should render element when message is provided', () => {
      const { container } = render(<FormError message="Test" />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle multiple renders with same message', () => {
      const { rerender } = render(<FormError message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
      rerender(<FormError message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('should have outer wrapper div with correct classes', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv.className).toMatch(/w-full/);
      expect(outerDiv.className).toMatch(/flex/);
    });

    test('should have inner container with correct structure', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv.className).toMatch(/bg-destructive/);
    });

    test('should have icon and message as siblings', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv?.childNodes.length).toBe(2);
    });
  });

  describe('Styling - Outer Wrapper', () => {
    test('should have w-full class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/w-full/);
    });

    test('should have flex class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/flex/);
    });

    test('should have items-center class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/items-center/);
    });

    test('should have justify-center class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/justify-center/);
    });

    test('should have mt-4 class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/mt-4/);
    });
  });

  describe('Styling - Inner Container', () => {
    test('should have bg-destructive/80 background', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-destructive/);
    });

    test('should have p-3 padding', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/p-3/);
    });

    test('should have rounded-md class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/rounded-md/);
    });

    test('should have flex class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/flex/);
    });

    test('should have gap-x-2 spacing', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/gap-x-2/);
    });

    test('should have text-sm class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-sm/);
    });

    test('should have text-white color', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-white/);
    });

    test('should have justify-center class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/justify-center/);
    });

    test('should have max-w-72 class', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/max-w-72/);
    });

    test('should have all styling classes together', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-destructive/);
      expect(innerDiv.className).toMatch(/p-3/);
      expect(innerDiv.className).toMatch(/rounded-md/);
      expect(innerDiv.className).toMatch(/flex/);
      expect(innerDiv.className).toMatch(/gap-x-2/);
      expect(innerDiv.className).toMatch(/text-sm/);
      expect(innerDiv.className).toMatch(/text-white/);
      expect(innerDiv.className).toMatch(/justify-center/);
      expect(innerDiv.className).toMatch(/max-w-72/);
    });

    test('should apply styling to inner container not outer', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(outerDiv.className).not.toMatch(/bg-destructive/);
      expect(innerDiv.className).toMatch(/bg-destructive/);
    });
  });

  describe('Icon Styling', () => {
    test('should have h-4 width class', () => {
      render(<FormError message="Test" />);
      const icon = screen.getByTestId('exclamation-triangle-icon');
      expect(icon.className).toMatch(/h-4/);
    });

    test('should have w-4 height class', () => {
      render(<FormError message="Test" />);
      const icon = screen.getByTestId('exclamation-triangle-icon');
      expect(icon.className).toMatch(/w-4/);
    });

    test('icon should be small square', () => {
      render(<FormError message="Test" />);
      const icon = screen.getByTestId('exclamation-triangle-icon');
      expect(icon.className).toMatch(/h-4/);
      expect(icon.className).toMatch(/w-4/);
    });
  });

  describe('Message Text', () => {
    test('should display simple message', () => {
      render(<FormError message="Error!" />);
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    test('should display message with special characters', () => {
      render(<FormError message="Error! @#$%" />);
      expect(screen.getByText('Error! @#$%')).toBeInTheDocument();
    });

    test('should display message with multiple words', () => {
      render(<FormError message="Your operation failed" />);
      expect(screen.getByText('Your operation failed')).toBeInTheDocument();
    });

    test('should display very long message', () => {
      const longMessage = 'This is a very long error message that spans multiple words and should still be displayed correctly';
      render(<FormError message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('should display message properly', () => {
      render(<FormError message="Test message" />);
      const paragraph = screen.getByText('Test message');
      expect(paragraph).toBeInTheDocument();
    });

    test('should display message in paragraph tag', () => {
      render(<FormError message="Test" />);
      const paragraph = screen.getByText('Test');
      expect(paragraph.tagName).toBe('P');
    });
  });

  describe('Conditional Rendering', () => {
    test('should render only when message has content', () => {
      const { container: container1 } = render(<FormError message="Test" />);
      expect(container1.firstChild).not.toBeNull();

      const { container: container2 } = render(<FormError message="" />);
      expect(container2.firstChild).toBeNull();
    });

    test('should toggle visibility based on message prop', () => {
      const { rerender, container } = render(<FormError message="Test" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<FormError message={undefined} />);
      expect(container.firstChild).toBeNull();

      rerender(<FormError message="Back" />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle message change from empty to populated', () => {
      const { rerender, container } = render(<FormError message="" />);
      expect(container.firstChild).toBeNull();

      rerender(<FormError message="Now visible" />);
      expect(screen.getByText('Now visible')).toBeInTheDocument();
    });

    test('should handle message change from populated to empty', () => {
      const { rerender } = render(<FormError message="Visible" />);
      expect(screen.getByText('Visible')).toBeInTheDocument();

      rerender(<FormError message="" />);
      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('should accept string message prop', () => {
      render(<FormError message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('should accept undefined message prop', () => {
      const { container } = render(<FormError message={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('should work without any props', () => {
      const { container } = render(<FormError />);
      expect(container.firstChild).toBeNull();
    });

    test('should accept whitespace-only message', () => {
      const { container } = render(<FormError message="   " />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle null message', () => {
      const { container } = render(<FormError message={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Component Lifecycle', () => {
    test('should not throw on mount', () => {
      expect(() => {
        render(<FormError message="Test" />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<FormError message="Test" />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle prop updates', () => {
      const { rerender } = render(<FormError message="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<FormError message="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    test('should not render null when message changes', () => {
      const { rerender, container } = render(<FormError message="First" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<FormError message="Second" />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle message with only spaces', () => {
      const { container } = render(<FormError message="     " />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle message with numbers', () => {
      render(<FormError message="Error code 404" />);
      expect(screen.getByText('Error code 404')).toBeInTheDocument();
    });

    test('should handle message with symbols', () => {
      render(<FormError message="!@#$%^&*()" />);
      expect(screen.getByText('!@#$%^&*()')).toBeInTheDocument();
    });

    test('should handle message with URLs', () => {
      render(<FormError message="Failed to load https://example.com" />);
      expect(screen.getByText('Failed to load https://example.com')).toBeInTheDocument();
    });

    test('should handle message with quotes', () => {
      render(<FormError message='Error: "Invalid input"' />);
      expect(screen.getByText('Error: "Invalid input"')).toBeInTheDocument();
    });

    test('should handle message with apostrophes', () => {
      render(<FormError message="It's an error" />);
      expect(screen.getByText("It's an error")).toBeInTheDocument();
    });

    test('should handle very long message', () => {
      const veryLongMessage = 'Error Line 1 Error Line 2 Error Line 3 Error Line 1 Error Line 2 Error Line 3 Error Line 1 Error Line 2 Error Line 3';
      render(<FormError message={veryLongMessage} />);
      expect(screen.getByText(veryLongMessage)).toBeInTheDocument();
    });
  });

  describe('Icon Integration', () => {
    test('should render ExclamationTriangleIcon', () => {
      render(<FormError message="Test" />);
      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();
    });

    test('should render icon element correctly', () => {
      const { container } = render(<FormError message="Test" />);
      const icon = container.querySelector('[data-testid="exclamation-triangle-icon"]');
      expect(icon).toBeInTheDocument();
    });

    test('icon should be present in all error renders', () => {
      const { rerender } = render(<FormError message="Test 1" />);
      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();

      rerender(<FormError message="Test 2" />);
      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();
    });

    test('should only have one icon', () => {
      const { container } = render(<FormError message="Test" />);
      const icons = container.querySelectorAll('[data-testid="exclamation-triangle-icon"]');
      expect(icons.length).toBe(1);
    });
  });

  describe('Accessibility', () => {
    test('message should be readable by screen readers', () => {
      render(<FormError message="Error message" />);
      const paragraph = screen.getByText('Error message');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph.tagName).toBe('P');
    });

    test('should have icon present for visual feedback', () => {
      render(<FormError message="Test" />);
      const icon = screen.getByTestId('exclamation-triangle-icon');
      expect(icon).toBeInTheDocument();
    });

    test('should have text color with proper contrast', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-white/);
    });
  });

  describe('Display Properties', () => {
    test('should be centered horizontally', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/justify-center/);
    });

    test('should be centered vertically', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/items-center/);
    });

    test('should have full width', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/w-full/);
    });

    test('should have rounded corners', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/rounded-md/);
    });

    test('should have padding', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/p-3/);
    });

    test('should have max width constraint', () => {
      const { container } = render(<FormError message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/max-w-72/);
    });
  });

  describe('Full Integration', () => {
    test('should render complete error message component', () => {
      render(<FormError message="Operation failed successfully" />);
      expect(screen.getByText('Operation failed successfully')).toBeInTheDocument();
      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();
    });

    test('should display error message with proper styling', () => {
      const { container } = render(<FormError message="Error" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-destructive/);
      expect(innerDiv.className).toMatch(/text-white/);
    });

    test('should handle various error scenarios', () => {
      const { rerender, container } = render(<FormError message="Test 1" />);
      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(container.firstChild).not.toBeNull();

      rerender(<FormError message="Test 2" />);
      expect(screen.getByText('Test 2')).toBeInTheDocument();

      rerender(<FormError />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Validation', () => {
    test('should properly hide when no message provided', () => {
      const { container } = render(<FormError />);
      expect(container.firstChild).toBeNull();
    });

    test('should accept various message types', () => {
      const { rerender } = render(<FormError message="string message" />);
      expect(screen.getByText('string message')).toBeInTheDocument();

      rerender(<FormError message={undefined} />);
      expect(screen.queryByText('string message')).not.toBeInTheDocument();
    });

    test('should handle rapid message changes', () => {
      const { rerender } = render(<FormError message="First" />);
      rerender(<FormError message="Second" />);
      rerender(<FormError message="Third" />);
      expect(screen.getByText('Third')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    });
  });
});
