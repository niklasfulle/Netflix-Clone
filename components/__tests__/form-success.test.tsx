'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormSuccess } from '../form-success';

// Mock the lucide-react CheckCircleIcon
jest.mock('lucide-react', () => ({
  CheckCircleIcon: ({ className, ...props }: { className: string }) => (
    <div data-testid="check-circle-icon" className={className} {...props} />
  ),
}));

describe('FormSuccess', () => {
  describe('Rendering', () => {
    test('should render when message prop is provided', () => {
      render(<FormSuccess message="Success!" />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    test('should not render when message prop is undefined', () => {
      const { container } = render(<FormSuccess message={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when no message prop is provided', () => {
      const { container } = render(<FormSuccess />);
      expect(container.firstChild).toBeNull();
    });

    test('should not display when message is empty string', () => {
      const { container } = render(<FormSuccess message="" />);
      expect(container.firstChild).toBeNull();
    });

    test('should render null explicitly when message is empty', () => {
      const result = render(<FormSuccess message="" />);
      expect(result.container.childNodes.length).toBe(0);
    });

    test('should render element when message is provided', () => {
      const { container } = render(<FormSuccess message="Test" />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle multiple renders with same message', () => {
      const { rerender } = render(<FormSuccess message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
      rerender(<FormSuccess message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('should have outer wrapper div with correct classes', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv.className).toMatch(/w-full/);
      expect(outerDiv.className).toMatch(/flex/);
    });

    test('should have inner container with correct structure', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv.className).toMatch(/bg-green-600/);
    });

    test('should have icon and message as siblings', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv?.childNodes.length).toBe(2);
    });
  });

  describe('Styling - Outer Wrapper', () => {
    test('should have w-full class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/w-full/);
    });

    test('should have flex class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/flex/);
    });

    test('should have items-center class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/items-center/);
    });

    test('should have justify-center class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/justify-center/);
    });

    test('should have mt-4 class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/mt-4/);
    });
  });

  describe('Styling - Inner Container', () => {
    test('should have bg-green-600/80 background', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-green-600/);
    });

    test('should have p-3 padding', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/p-3/);
    });

    test('should have rounded-md class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/rounded-md/);
    });

    test('should have flex class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/flex/);
    });

    test('should have gap-x-2 spacing', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/gap-x-2/);
    });

    test('should have text-sm class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-sm/);
    });

    test('should have text-gray-200 color', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-gray-200/);
    });

    test('should have justify-center class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const innerDiv = container.querySelector('div > div') as HTMLElement;
      expect(innerDiv.className).toMatch(/justify-center/);
    });

    test('should have max-w-72 class', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/max-w-72/);
    });

    test('should have all styling classes together', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-green-600/);
      expect(innerDiv.className).toMatch(/p-3/);
      expect(innerDiv.className).toMatch(/rounded-md/);
      expect(innerDiv.className).toMatch(/flex/);
      expect(innerDiv.className).toMatch(/gap-x-2/);
      expect(innerDiv.className).toMatch(/text-sm/);
      expect(innerDiv.className).toMatch(/text-gray-200/);
      expect(innerDiv.className).toMatch(/justify-center/);
      expect(innerDiv.className).toMatch(/max-w-72/);
    });

    test('should apply styling to inner container not outer', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(outerDiv.className).not.toMatch(/bg-green-600/);
      expect(innerDiv.className).toMatch(/bg-green-600/);
    });
  });

  describe('Icon Styling', () => {
    test('should have h-4 width class', () => {
      render(<FormSuccess message="Test" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon.className).toMatch(/h-4/);
    });

    test('should have w-4 height class', () => {
      render(<FormSuccess message="Test" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon.className).toMatch(/w-4/);
    });

    test('icon should be small square', () => {
      render(<FormSuccess message="Test" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon.className).toMatch(/h-4/);
      expect(icon.className).toMatch(/w-4/);
    });
  });

  describe('Message Text', () => {
    test('should display simple message', () => {
      render(<FormSuccess message="Success!" />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    test('should display message with special characters', () => {
      render(<FormSuccess message="Success! @#$%" />);
      expect(screen.getByText('Success! @#$%')).toBeInTheDocument();
    });

    test('should display message with multiple words', () => {
      render(<FormSuccess message="Your operation was successful" />);
      expect(screen.getByText('Your operation was successful')).toBeInTheDocument();
    });

    test('should display very long message', () => {
      const longMessage = 'This is a very long message that spans multiple words and should still be displayed correctly';
      render(<FormSuccess message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('should display message properly', () => {
      render(<FormSuccess message="Test message" />);
      const paragraph = screen.getByText('Test message');
      expect(paragraph).toBeInTheDocument();
    });

    test('should display message in paragraph tag', () => {
      render(<FormSuccess message="Test" />);
      const paragraph = screen.getByText('Test');
      expect(paragraph.tagName).toBe('P');
    });
  });

  describe('Conditional Rendering', () => {
    test('should render only when message has content', () => {
      const { container: container1 } = render(<FormSuccess message="Test" />);
      expect(container1.firstChild).not.toBeNull();

      const { container: container2 } = render(<FormSuccess message="" />);
      expect(container2.firstChild).toBeNull();
    });

    test('should toggle visibility based on message prop', () => {
      const { rerender, container } = render(<FormSuccess message="Test" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<FormSuccess message={undefined} />);
      expect(container.firstChild).toBeNull();

      rerender(<FormSuccess message="Back" />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle message change from empty to populated', () => {
      const { rerender, container } = render(<FormSuccess message="" />);
      expect(container.firstChild).toBeNull();

      rerender(<FormSuccess message="Now visible" />);
      expect(screen.getByText('Now visible')).toBeInTheDocument();
    });

    test('should handle message change from populated to empty', () => {
      const { rerender } = render(<FormSuccess message="Visible" />);
      expect(screen.getByText('Visible')).toBeInTheDocument();

      rerender(<FormSuccess message="" />);
      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('should accept string message prop', () => {
      render(<FormSuccess message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('should accept undefined message prop', () => {
      const { container } = render(<FormSuccess message={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('should work without any props', () => {
      const { container } = render(<FormSuccess />);
      expect(container.firstChild).toBeNull();
    });

    test('should accept whitespace-only message', () => {
      const { container } = render(<FormSuccess message="   " />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle null message', () => {
      const { container } = render(<FormSuccess message={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Component Lifecycle', () => {
    test('should not throw on mount', () => {
      expect(() => {
        render(<FormSuccess message="Test" />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<FormSuccess message="Test" />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle prop updates', () => {
      const { rerender } = render(<FormSuccess message="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<FormSuccess message="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    test('should not render null when message changes', () => {
      const { rerender, container } = render(<FormSuccess message="First" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<FormSuccess message="Second" />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle message with only spaces', () => {
      const { container } = render(<FormSuccess message="     " />);
      expect(container.firstChild).not.toBeNull();
    });

    test('should handle message with numbers', () => {
      render(<FormSuccess message="12345" />);
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    test('should handle message with symbols', () => {
      render(<FormSuccess message="!@#$%^&*()" />);
      expect(screen.getByText('!@#$%^&*()')).toBeInTheDocument();
    });

    test('should handle message with URLs', () => {
      render(<FormSuccess message="Visit https://example.com" />);
      expect(screen.getByText('Visit https://example.com')).toBeInTheDocument();
    });

    test('should handle message with quotes', () => {
      render(<FormSuccess message='Say "hello" to world' />);
      expect(screen.getByText('Say "hello" to world')).toBeInTheDocument();
    });

    test('should handle message with apostrophes', () => {
      render(<FormSuccess message="It's working properly" />);
      expect(screen.getByText("It's working properly")).toBeInTheDocument();
    });

    test('should handle very long message', () => {
      const veryLongMessage = 'Line 1 Line 2 Line 3 Line 1 Line 2 Line 3 Line 1 Line 2 Line 3 Line 1 Line 2 Line 3 Line 1 Line 2 Line 3';
      render(<FormSuccess message={veryLongMessage} />);
      expect(screen.getByText(veryLongMessage)).toBeInTheDocument();
    });
  });

  describe('Icon Integration', () => {
    test('should render CheckCircleIcon', () => {
      render(<FormSuccess message="Test" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('should render icon element correctly', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const icon = container.querySelector('[data-testid="check-circle-icon"]');
      expect(icon).toBeInTheDocument();
    });

    test('icon should be present in all success renders', () => {
      const { rerender } = render(<FormSuccess message="Test 1" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();

      rerender(<FormSuccess message="Test 2" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('should only have one icon', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const icons = container.querySelectorAll('[data-testid="check-circle-icon"]');
      expect(icons.length).toBe(1);
    });
  });

  describe('Accessibility', () => {
    test('message should be readable by screen readers', () => {
      render(<FormSuccess message="Success message" />);
      const paragraph = screen.getByText('Success message');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph.tagName).toBe('P');
    });

    test('should have icon present for visual feedback', () => {
      render(<FormSuccess message="Test" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toBeInTheDocument();
    });

    test('should have text color with proper contrast', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/text-gray-200/);
    });
  });

  describe('Display Properties', () => {
    test('should be centered horizontally', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/justify-center/);
    });

    test('should be centered vertically', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/items-center/);
    });

    test('should have full width', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toMatch(/w-full/);
    });

    test('should have rounded corners', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/rounded-md/);
    });

    test('should have padding', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/p-3/);
    });

    test('should have max width constraint', () => {
      const { container } = render(<FormSuccess message="Test" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/max-w-72/);
    });
  });

  describe('Full Integration', () => {
    test('should render complete success message component', () => {
      render(<FormSuccess message="Operation completed successfully" />);
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('should display success message with proper styling', () => {
      const { container } = render(<FormSuccess message="Success" />);
      const outerDiv = container.firstChild as HTMLElement;
      const innerDiv = outerDiv.firstChild as HTMLElement;
      expect(innerDiv.className).toMatch(/bg-green-600/);
      expect(innerDiv.className).toMatch(/text-gray-200/);
    });

    test('should handle various success scenarios', () => {
      const { rerender, container } = render(<FormSuccess message="Test 1" />);
      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(container.firstChild).not.toBeNull();

      rerender(<FormSuccess message="Test 2" />);
      expect(screen.getByText('Test 2')).toBeInTheDocument();

      rerender(<FormSuccess />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Validation', () => {
    test('should properly hide when no message provided', () => {
      const { container } = render(<FormSuccess />);
      expect(container.firstChild).toBeNull();
    });

    test('should accept various message types', () => {
      const { rerender } = render(<FormSuccess message="string message" />);
      expect(screen.getByText('string message')).toBeInTheDocument();

      rerender(<FormSuccess message={undefined} />);
      expect(screen.queryByText('string message')).not.toBeInTheDocument();
    });

    test('should handle rapid message changes', () => {
      const { rerender } = render(<FormSuccess message="First" />);
      rerender(<FormSuccess message="Second" />);
      rerender(<FormSuccess message="Third" />);
      expect(screen.getByText('Third')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    });
  });
});
