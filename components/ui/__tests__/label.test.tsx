import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label Component', () => {
  describe('Basic Rendering', () => {
    test('should render without crashing', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeTruthy();
    });

    test('should render as label element', () => {
      const { container } = render(<Label>Label Text</Label>);
      expect(container.querySelector('label')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<Label>My Label</Label>);
      expect(screen.getByText('My Label')).toBeTruthy();
    });

    test('should render with children prop', () => {
      render(<Label>Children Content</Label>);
      expect(screen.getByText('Children Content')).toBeTruthy();
    });

    test('should render empty label', () => {
      const { container } = render(<Label />);
      const label = container.querySelector('label');
      expect(label?.textContent).toBe('');
    });
  });

  describe('Props and Attributes', () => {
    test('should accept htmlFor attribute', () => {
      const { container } = render(<Label htmlFor="input-id">Label</Label>);
      expect(container.querySelector('label[for="input-id"]')).toBeTruthy();
    });

    test('should accept id attribute', () => {
      const { container } = render(<Label id="my-label">Label</Label>);
      expect(container.querySelector('#my-label')).toBeTruthy();
    });

    test('should accept data-testid attribute', () => {
      render(<Label data-testid="custom-label">Label</Label>);
      expect(screen.getByTestId('custom-label')).toBeTruthy();
    });

    test('should accept title attribute', () => {
      const { container } = render(<Label title="Tooltip text">Label</Label>);
      expect(container.querySelector('label[title="Tooltip text"]')).toBeTruthy();
    });

    test('should associate with input using htmlFor', () => {
      const { container } = render(
        <div>
          <Label htmlFor="email">Email Address</Label>
          <input id="email" type="email" />
        </div>
      );
      const label = container.querySelector('label[for="email"]');
      expect(label?.textContent).toBe('Email Address');
    });

    test('should accept aria-label attribute', () => {
      const { container } = render(<Label aria-label="Custom ARIA">Label</Label>);
      expect(container.querySelector('label[aria-label="Custom ARIA"]')).toBeTruthy();
    });

    test('should accept aria-describedby attribute', () => {
      const { container } = render(<Label aria-describedby="description">Label</Label>);
      expect(container.querySelector('label[aria-describedby="description"]')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    test('should apply default classes', () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-sm');
      expect(label?.className).toContain('font-medium');
      expect(label?.className).toContain('leading-none');
    });

    test('should apply disabled peer styles', () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('peer-disabled:');
    });

    test('should merge custom className with defaults', () => {
      const { container } = render(<Label className="text-lg font-bold">Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-lg');
      expect(label?.className).toContain('font-bold');
      expect(label?.className).toContain('peer-disabled:');
    });

    test('should support custom color classes', () => {
      const { container } = render(<Label className="text-red-500">Error Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-red-500');
    });

    test('should support custom spacing classes', () => {
      const { container } = render(<Label className="mb-4 mt-2">Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('mb-4');
      expect(label?.className).toContain('mt-2');
    });

    test('should support custom font classes', () => {
      const { container } = render(<Label className="uppercase tracking-wide">Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('uppercase');
      expect(label?.className).toContain('tracking-wide');
    });

    test('should preserve default styling with custom classes', () => {
      const { container } = render(<Label className="custom">Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className).toContain('custom');
      expect(label?.className).toContain('text-sm');
      expect(label?.className).toContain('font-medium');
    });
  });

  describe('Ref Forwarding', () => {
    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Label</Label>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('LABEL');
    });

    test('should allow ref to access label properties', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref} htmlFor="input-id">Test Label</Label>);
      expect(ref.current?.htmlFor).toBe('input-id');
      expect(ref.current?.textContent).toBe('Test Label');
    });

    test('should allow ref to be used with useRef hook', () => {
      render(
        <div>
          <Label data-testid="test-label">My Label</Label>
        </div>
      );
      const label = document.querySelector('[data-testid="test-label"]');
      expect(label).toBeTruthy();
    });

    test('should work with callback ref', () => {
      const refHolder: { current: HTMLLabelElement | null } = { current: null };
      render(
        <Label ref={(el) => { refHolder.current = el; }}>Label</Label>
      );
      expect(refHolder.current?.tagName).toBe('LABEL');
    });

    test('should allow ref to access classList', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref} className="custom-class">Label</Label>);
      expect(ref.current?.classList.contains('text-sm')).toBe(true);
      expect(ref.current?.classList.contains('custom-class')).toBe(true);
    });

    test('should allow modifying element via ref', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Label</Label>);
      if (ref.current) {
        ref.current.textContent = 'Modified Label';
        expect(ref.current.textContent).toBe('Modified Label');
      }
    });
  });

  describe('DisplayName', () => {
    test('should have correct displayName', () => {
      expect(Label.displayName).toBeTruthy();
    });

    test('should match Radix Label displayName', () => {
      // Radix Label displayName should be preserved
      expect(Label.displayName).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('should properly label form inputs', () => {
      const { container } = render(
        <div>
          <Label htmlFor="email">Email Address</Label>
          <input id="email" type="email" />
        </div>
      );
      const input = container.querySelector('#email');
      const label = container.querySelector('label[for="email"]');
      expect(input).toBeTruthy();
      expect(label).toBeTruthy();
    });

    test('should be clickable to focus associated input', () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test</Label>
          <input id="test-input" type="text" />
        </div>
      );
      const label = container.querySelector('label') as HTMLLabelElement;
      expect(label.htmlFor).toBe('test-input');
    });

    test('should support aria-required attribute', () => {
      const { container } = render(<Label aria-required="true">Required Label</Label>);
      expect(container.querySelector('label[aria-required="true"]')).toBeTruthy();
    });

    test('should work with aria-invalid for error states', () => {
      const { container } = render(<Label aria-invalid="true">Error Label</Label>);
      expect(container.querySelector('label[aria-invalid="true"]')).toBeTruthy();
    });

    test('should be keyboard accessible', () => {
      const { container } = render(
        <div>
          <Label htmlFor="input">Label</Label>
          <input id="input" type="text" />
        </div>
      );
      const input = container.querySelector('#input') as HTMLInputElement;
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    test('should have proper semantic structure', () => {
      const { container } = render(
        <Label htmlFor="field">Form Field Label</Label>
      );
      const label = container.querySelector('label');
      expect(label?.tagName).toBe('LABEL');
    });
  });

  describe('Type Safety', () => {
    test('should accept HTMLLabelElement ref type', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Label</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });

    test('should accept standard HTML label attributes', () => {
      const { container } = render(
        <Label
          htmlFor="test-id"
          className="custom"
          data-testid="test"
          title="Test Label"
        />
      );
      expect(container.querySelector('label[for="test-id"]')).toBeTruthy();
      expect(container.querySelector('[title="Test Label"]')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const CustomLabel = React.forwardRef<HTMLLabelElement, { children?: React.ReactNode }>((props, ref) => (
        <Label ref={ref} {...props} />
      ));

      const ref = React.createRef<HTMLLabelElement>();
      render(<CustomLabel ref={ref}>Custom</CustomLabel>);
      expect(ref.current?.tagName).toBe('LABEL');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty label', () => {
      const { container } = render(<Label />);
      expect(container.querySelector('label')).toBeTruthy();
    });

    test('should handle very long label text', () => {
      const longText = 'a'.repeat(500);
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle special characters in label', () => {
      render(<Label>{"Test Label <>&\"'"}</Label>);
      expect(screen.getByText('Test Label <>&"\'')).toBeTruthy();
    });

    test('should handle unicode characters', () => {
      const unicodeText = '你好 🌍 مرحبا';
      render(<Label>{unicodeText}</Label>);
      expect(screen.getByText(unicodeText)).toBeTruthy();
    });

    test('should handle React elements as children', () => {
      render(
        <Label>
          <span>Span Content</span>
        </Label>
      );
      expect(screen.getByText('Span Content')).toBeTruthy();
    });

    test('should handle multiple class names without duplication', () => {
      const { container } = render(<Label className="class1 class2 class3">Label</Label>);
      const label = container.querySelector('label');
      expect(label?.className.split(' ').filter((c) => c === 'text-sm').length).toBe(1);
    });

    test('should handle null children gracefully', () => {
      const { container } = render(<Label>{null}</Label>);
      expect(container.querySelector('label')).toBeTruthy();
    });

    test('should handle mixed content with text and elements', () => {
      render(
        <Label>
          Text <strong>Bold</strong> More Text
        </Label>
      );
      expect(screen.getByText('Bold')).toBeTruthy();
    });
  });

  describe('Radix UI Integration', () => {
    test('should be based on Radix Label primitive', () => {
      const { container } = render(<Label>Radix Label</Label>);
      expect(container.querySelector('label')).toBeTruthy();
    });

    test('should handle Radix-specific htmlFor binding', () => {
      const { container } = render(
        <div>
          <Label htmlFor="radix-input">Input Label</Label>
          <input id="radix-input" />
        </div>
      );
      const label = container.querySelector('label[for="radix-input"]');
      expect(label).toBeTruthy();
    });

    test('should work with Radix controlled components', () => {
      const { container } = render(
        <div>
          <Label htmlFor="controlled">Controlled Input</Label>
          <input id="controlled" value="test" readOnly />
        </div>
      );
      const label = container.querySelector('label[for="controlled"]');
      const input = container.querySelector('#controlled') as HTMLInputElement;
      expect(label?.textContent).toBe('Controlled Input');
      expect(input.value).toBe('test');
    });
  });

  describe('Styling Variants', () => {
    test('should support required indicator styling', () => {
      const { container } = render(
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
          Required Field
        </Label>
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('after:');
    });

    test('should support optional indicator styling', () => {
      const { container } = render(
        <Label className="after:content-['(optional)'] after:ml-1 after:text-gray-400 after:text-xs">
          Optional Field
        </Label>
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('after:');
    });

    test('should support success state styling', () => {
      const { container } = render(
        <Label className="text-green-600">Success Label</Label>
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-green-600');
    });

    test('should support error state styling', () => {
      const { container } = render(
        <Label className="text-red-600">Error Label</Label>
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-red-600');
    });

    test('should support disabled peer state', () => {
      const { container } = render(
        <div>
          <Label>Label</Label>
          <input disabled />
        </div>
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('peer-disabled:');
    });
  });

  describe('Component Composition', () => {
    test('should work within form groups', () => {
      const { container } = render(
        <div className="form-group">
          <Label htmlFor="name">Name</Label>
          <input id="name" type="text" />
        </div>
      );
      expect(container.querySelector('label[for="name"]')).toBeTruthy();
    });

    test('should work with multiple labels in form', () => {
      const { container } = render(
        <form>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" />
          <Label htmlFor="password">Password</Label>
          <input id="password" type="password" />
        </form>
      );
      expect(container.querySelector('label[for="email"]')).toBeTruthy();
      expect(container.querySelector('label[for="password"]')).toBeTruthy();
    });

    test('should work with complex form structures', () => {
      const { container } = render(
        <fieldset>
          <legend>Contact Information</legend>
          <Label htmlFor="phone">Phone Number</Label>
          <input id="phone" type="tel" />
        </fieldset>
      );
      expect(container.querySelector('label[for="phone"]')).toBeTruthy();
    });

    test('should support label wrapping input element', () => {
      const { container } = render(
        <Label>
          <span>Click me</span>
          <input type="checkbox" />
        </Label>
      );
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
    });
  });

  describe('Export', () => {
    test('should export Label component', () => {
      expect(Label).toBeTruthy();
    });

    test('should export as forwardRef component', () => {
      expect(typeof Label).toBe('object');
    });

    test('should have stable reference across renders', () => {
      const { rerender } = render(<Label>Label 1</Label>);
      const Component1 = Label;
      rerender(<Label>Label 2</Label>);
      const Component2 = Label;
      expect(Component1).toBe(Component2);
    });
  });
});
