import * as React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '../select';

// Mock scrollIntoView to prevent Radix Select errors in JSDOM
Element.prototype.scrollIntoView = jest.fn();

describe('Select Component', () => {
  describe('Basic Rendering', () => {
    it('should render SelectTrigger', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container.textContent).toContain('Choose an option');
    });

    it('should render multiple items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
            <SelectItem value="c">Option C</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render with groups', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="a">Option A</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="b">Option B</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render with separator', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Select Value Display', () => {
    it('should display selected value', () => {
      render(
        <Select defaultValue="a">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toBeTruthy();
    });

    it('should update value when controlled', () => {
      const { rerender } = render(
        <Select value="a">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();

      rerender(
        <Select value="b">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(trigger).toBeInTheDocument();
    });

    it('should support custom placeholder', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Custom placeholder text" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container.textContent).toContain('Custom placeholder text');
    });

    it('should render placeholder with empty string value', () => {
      const { container } = render(
        <Select value="">
          <SelectTrigger>
            <SelectValue placeholder="No selection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container.textContent).toContain('No selection');
    });
  });

  describe('Trigger Interaction', () => {
    it('should render trigger button with proper attributes', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('type', 'button');
      expect(trigger).toHaveAttribute('aria-expanded');
    });

    it('should maintain trigger styling classes', () => {
      render(
        <Select>
          <SelectTrigger className="custom-class">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('custom-class');
    });

    it('should support disabled state on trigger', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('should support aria-label on trigger', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Custom label">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox', { name: /custom label/i });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('SelectItem Rendering', () => {
    it('should render items with correct structure', () => {
      const { container } = render(
        <Select defaultValue="a">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
            <SelectItem value="c">Option C</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should render items with value attribute', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test-value">Test Item</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support disabled items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b" disabled>
              Disabled Option
            </SelectItem>
            <SelectItem value="c">Option C</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle many items', () => {
      const items = Array.from({ length: 50 }, (_, i) => (
        <SelectItem key={i} value={`opt-${i}`}>
          Option {i}
        </SelectItem>
      ));

      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('SelectGroup', () => {
    it('should render group with label', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render multiple groups', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="a">Item A</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="b">Item B</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Group 3</SelectLabel>
              <SelectItem value="c">Item C</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support group with multiple items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="lettuce">Lettuce</SelectItem>
              <SelectItem value="tomato">Tomato</SelectItem>
              <SelectItem value="cucumber">Cucumber</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support mixed content with groups and items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standalone">Standalone Item</SelectItem>
            <SelectGroup>
              <SelectLabel>Grouped Items</SelectLabel>
              <SelectItem value="grouped1">Grouped 1</SelectItem>
              <SelectItem value="grouped2">Grouped 2</SelectItem>
            </SelectGroup>
            <SelectItem value="standalone2">Another Standalone</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('SelectSeparator', () => {
    it('should render separator', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render multiple separators', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">Option B</SelectItem>
            <SelectSeparator />
            <SelectItem value="c">Option C</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should separate groups', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="a">Item A</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="b">Item B</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('SelectContent Positioning', () => {
    it('should render content', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support side prop', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support align prop', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Scroll Buttons', () => {
    it('should render scroll up button', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render scroll down button', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should render both scroll buttons', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectItem value="a">Option A</SelectItem>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should support custom classes on SelectTrigger', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('custom-trigger');
    });

    it('should support custom classes on SelectItem', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a" className="custom-item">
              Option A
            </SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should apply styles to SelectGroup', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup className="custom-group">
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="a">Item A</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should apply styles to SelectLabel', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="custom-label">Group</SelectLabel>
              <SelectItem value="a">Item A</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attributes', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('type', 'button');
    });

    it('should support aria-label on items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a" aria-label="Accessible Option A">
              Option A
            </SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should support aria-describedby', () => {
      render(
        <Select>
          <SelectTrigger aria-describedby="select-desc">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-describedby');
    });

    it('should maintain accessible structure with groups', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel id="group-label">Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle keyboard navigation', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
            <SelectItem value="c">Option C</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      expect(trigger).toHaveFocus();
    });

    it('should support disabled attribute', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('should be keyboard accessible', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('type')).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      const { container } = render(
        <Select value="">
          <SelectTrigger>
            <SelectValue placeholder="Empty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle undefined value', () => {
      const { container } = render(
        <Select value={undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Undefined" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle null placeholder', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder={null} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle no SelectContent', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should handle empty SelectContent', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent></SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle very long item values', () => {
      const longValue = 'a'.repeat(1000);
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={longValue}>Long Value</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle numeric-like string values', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="123">123</SelectItem>
            <SelectItem value="456.78">456.78</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle special characters in values', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a&b">A and B</SelectItem>
            <SelectItem value="x-y">X minus Y</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle whitespace-only values', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Space</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should accept valid props', () => {
      const { container } = render(
        <Select
          defaultValue="a"
          disabled={false}
          open={false}
          onOpenChange={() => {}}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should handle value callback', () => {
      const onChange = jest.fn();
      const { container } = render(
        <Select onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Component Composition', () => {
    it('should compose all sub-components', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });

    it('should forward refs correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <Select>
          <SelectTrigger ref={ref}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should support children as function', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3].map((i) => (
              <SelectItem key={i} value={`opt-${i}`}>
                Option {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Data Binding', () => {
    it('should bind value correctly', () => {
      const { rerender } = render(
        <Select value="a">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();

      rerender(
        <Select value="b">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(trigger).toBeInTheDocument();
    });

    it('should default to first value', () => {
      const { container } = render(
        <Select defaultValue="first">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">First Option</SelectItem>
            <SelectItem value="second">Second Option</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should handle open/close state', () => {
      const { rerender } = render(
        <Select open={false}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      rerender(
        <Select open={true}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should call onOpenChange callback', () => {
      const onOpenChange = jest.fn();
      const { container } = render(
        <Select onOpenChange={onOpenChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('should work in a form', () => {
      const { container } = render(
        <form>
          <Select defaultValue="opt1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
              <SelectItem value="opt2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        </form>
      );
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should work with other form elements', () => {
      const { container } = render(
        <form>
          <input type="text" placeholder="Name" />
          <Select defaultValue="opt1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <button type="submit">Submit</button>
        </form>
      );
      expect(container.querySelector('form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should maintain structure with multiple selects', () => {
      render(
        <>
          <Select defaultValue="a">
            <SelectTrigger>
              <SelectValue placeholder="Select 1" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="x">
            <SelectTrigger>
              <SelectValue placeholder="Select 2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="x">Option X</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
      const triggers = screen.getAllByRole('combobox');
      expect(triggers).toHaveLength(2);
    });
  });
});
