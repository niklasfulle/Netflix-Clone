import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  const defaultProps = {
    id: 'test-input',
    onChange: jest.fn(),
    onKeyDown: jest.fn(),
    value: '',
    lable: 'Test Label',
    type: 'text',
    required: false,
    error: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render without crashing', () => {
      render(<Input {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeTruthy();
    });

    test('should render input element', () => {
      render(<Input {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('should render label element', () => {
      render(<Input {...defaultProps} />);
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
    });

    test('should have correct id attribute', () => {
      render(<Input {...defaultProps} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.id).toBe('test-input');
    });

    test('should render with proper structure', () => {
      const { container } = render(<Input {...defaultProps} />);
      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toMatch(/relative/);
    });

    test('should render label with correct htmlFor attribute', () => {
      render(<Input {...defaultProps} />);
      const label = screen.getByText('Test Label') as HTMLLabelElement;
      expect(label.htmlFor).toBe('test-input');
    });
  });

  describe('Props Handling', () => {
    test('should handle id prop', () => {
      render(<Input {...defaultProps} id="custom-id" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.id).toBe('custom-id');
    });

    test('should handle value prop', () => {
      render(<Input {...defaultProps} value="Test value" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Test value');
    });

    test('should handle lable prop', () => {
      render(<Input {...defaultProps} lable="Custom Label" />);
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    test('should handle type prop', () => {
      render(<Input {...defaultProps} type="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    test('should handle required prop', () => {
      render(<Input {...defaultProps} required={true} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    test('should handle error prop', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('text-red-500');
    });

    test('should render without error styling when error is false', () => {
      const { container } = render(<Input {...defaultProps} error={false} />);
      const input = container.querySelector('input');
      expect(input?.className).not.toContain('ring-red-500');
    });
  });

  describe('Event Handlers', () => {
    test('should call onChange when input value changes', () => {
      const onChange = jest.fn();
      render(<Input {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(onChange).toHaveBeenCalled();
    });

    test('should call onChange with correct event', () => {
      const onChange = jest.fn();
      render(<Input {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: 'test' } });
      expect(onChange).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should call onKeyDown when key is pressed', () => {
      const onKeyDown = jest.fn();
      render(<Input {...defaultProps} onKeyDown={onKeyDown} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onKeyDown).toHaveBeenCalled();
    });

    test('should call onKeyDown with correct event', () => {
      const onKeyDown = jest.fn();
      render(<Input {...defaultProps} onKeyDown={onKeyDown} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.keyDown(input, { key: 'a' });
      expect(onKeyDown).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should handle multiple onChange calls', () => {
      const onChange = jest.fn();
      render(<Input {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    test('should handle multiple onKeyDown calls', () => {
      const onKeyDown = jest.fn();
      render(<Input {...defaultProps} onKeyDown={onKeyDown} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });
      fireEvent.keyDown(input, { key: 'c' });
      
      expect(onKeyDown).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    test('should have block display', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('block');
    });

    test('should have w-full class', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('w-full');
    });

    test('should have px-3 padding', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('px-3');
    });

    test('should have text-white color', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('text-white');
    });

    test('should have rounded-md border', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('rounded-md');
    });

    test('should have neutral-700 background', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('bg-neutral-700');
    });

    test('should have focus:outline-none', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('focus:outline-none');
    });

    test('should have appearance-none', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('appearance-none');
    });
  });

  describe('Error Styling', () => {
    test('should have red text color when error is true', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('text-red-500');
    });

    test('should have red ring when error is true', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('ring-red-500');
    });

    test('should have ring-1 when error is true', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('ring-1');
    });

    test('should apply error styling to label', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-red-500');
    });

    test('should not apply red error text when error is false', () => {
      const { container } = render(<Input {...defaultProps} error={false} />);
      const input = container.querySelector('input');
      expect(input?.className).not.toContain('text-red-500');
    });

    test('should not apply red ring when error is false', () => {
      const { container } = render(<Input {...defaultProps} error={false} />);
      const input = container.querySelector('input');
      expect(input?.className).not.toContain('ring-red-500');
    });
  });

  describe('Label Styling', () => {
    test('should have label with text-md', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-md');
    });

    test('should have label with text-zinc-400', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-zinc-400');
    });

    test('should have label with duration-150', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('duration-150');
    });

    test('should have label with absolute positioning', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('absolute');
    });

    test('should have label with proper z-index', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('z-10');
    });

    test('should have label with top-4', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('top-4');
    });

    test('should have label with left-6', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('left-6');
    });

    test('should have error color on label when error is true', () => {
      const { container } = render(<Input {...defaultProps} error={true} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('text-red-500');
    });
  });

  describe('Input Types', () => {
    test('should render text input by default', () => {
      render(<Input {...defaultProps} type="text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    test('should render email input', () => {
      render(<Input {...defaultProps} type="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    test('should render password input', () => {
      const { container } = render(<Input {...defaultProps} type="password" />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('password');
    });

    test('should render number input', () => {
      const { container } = render(<Input {...defaultProps} type="number" />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('number');
    });
  });

  describe('Placeholder Behavior', () => {
    test('should have placeholder attribute', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.placeholder).toBe(' ');
    });

    test('should have peer-placeholder-shown classes', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('peer-placeholder-shown:scale-100');
      expect(label?.className).toContain('peer-placeholder-shown:translate-y-0');
    });

    test('should have peer-focus classes', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('peer-focus:scale-75');
      expect(label?.className).toContain('peer-focus:-translate-y-3');
    });

    test('should have peer-focus classes on label', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('peer-focus:scale-75');
      expect(label?.className).toContain('peer-focus:-translate-y-3');
    });
  });

  describe('Required Attribute', () => {
    test('should set required attribute when required is true', () => {
      const { container } = render(<Input {...defaultProps} required={true} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    test('should not set required attribute when required is false', () => {
      const { container } = render(<Input {...defaultProps} required={false} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(false);
    });

    test('should not set required attribute when required is undefined', () => {
      const { container } = render(
        <Input {...defaultProps} required={undefined} />
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(false);
    });
  });

  describe('Value Display', () => {
    test('should display empty string value', () => {
      render(<Input {...defaultProps} value="" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    test('should display initial value', () => {
      render(<Input {...defaultProps} value="Initial value" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Initial value');
    });

    test('should update value when props change', () => {
      const { rerender } = render(<Input {...defaultProps} value="First" />);
      let input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('First');

      rerender(<Input {...defaultProps} value="Second" />);
      input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Second');
    });

    test('should handle long string values', () => {
      const longValue = 'a'.repeat(100);
      render(<Input {...defaultProps} value={longValue} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe(longValue);
    });

    test('should handle special characters in value', () => {
      render(<Input {...defaultProps} value="Test@123!#$" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Test@123!#$');
    });
  });

  describe('Accessibility', () => {
    test('should have accessible label', () => {
      render(<Input {...defaultProps} />);
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
    });

    test('should associate label with input via htmlFor', () => {
      render(<Input {...defaultProps} />);
      const label = screen.getByText('Test Label') as HTMLLabelElement;
      expect(label.htmlFor).toBe('test-input');
    });

    test('should have proper focus styles', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('focus:outline-none');
      expect(input?.className).toContain('focus:ring-0');
    });

    test('should be keyboard navigable', () => {
      render(<Input {...defaultProps} />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Component Stability', () => {
    test('should not throw on mount', () => {
      expect(() => {
        render(<Input {...defaultProps} />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<Input {...defaultProps} />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should render consistently', () => {
      const { rerender } = render(<Input {...defaultProps} />);
      const input1 = screen.getByRole('textbox') as HTMLInputElement;
      const id1 = input1.id;

      rerender(<Input {...defaultProps} />);
      const input2 = screen.getByRole('textbox') as HTMLInputElement;
      const id2 = input2.id;

      expect(id1).toBe(id2);
    });

    test('should handle rapid prop updates', () => {
      const { rerender } = render(<Input {...defaultProps} value="v1" />);
      rerender(<Input {...defaultProps} value="v2" />);
      rerender(<Input {...defaultProps} value="v3" />);
      rerender(<Input {...defaultProps} value="v4" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('v4');
    });

    test('should maintain focus on prop change', () => {
      const { rerender } = render(<Input {...defaultProps} value="test" />);
      const input = screen.getByRole('textbox');
      input.focus();

      rerender(<Input {...defaultProps} value="updated" />);
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty label', () => {
      render(<Input {...defaultProps} lable="" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('should handle undefined type', () => {
      const { container } = render(<Input {...defaultProps} type={undefined} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    test('should handle special characters in label', () => {
      render(<Input {...defaultProps} lable="Test & Label!" />);
      expect(screen.getByText('Test & Label!')).toBeInTheDocument();
    });

    test('should handle very long label', () => {
      const longLabel = 'Test Label '.repeat(10);
      const { container } = render(<Input {...defaultProps} lable={longLabel} />);
      const label = container.querySelector('label');
      expect(label?.textContent).toBe(longLabel);
    });

    test('should handle whitespace in value', () => {
      render(<Input {...defaultProps} value="  test  value  " />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('  test  value  ');
    });

    test('should handle numeric string values', () => {
      render(<Input {...defaultProps} value="12345" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('12345');
    });
  });

  describe('Focus Behavior', () => {
    test('should have focus:outline-none', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('focus:outline-none');
    });

    test('should have focus:ring-0', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('focus:ring-0');
    });

    test('should be focusable', () => {
      render(<Input {...defaultProps} />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    test('should have peer class on input', () => {
      const { container } = render(<Input {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('peer');
    });
  });

  describe('Label Transform', () => {
    test('should have transform class', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('transfrom');
    });

    test('should have scale-75 by default', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('scale-75');
    });

    test('should have -translate-y-3 by default', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('-translate-y-3');
    });

    test('should have origin-[0] for transform origin', () => {
      const { container } = render(<Input {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label?.className).toContain('origin-[0]');
    });
  });

  describe('Complete Interaction Flow', () => {
    test('should handle full user interaction', () => {
      const onChange = jest.fn();
      const onKeyDown = jest.fn();
      render(
        <Input
          {...defaultProps}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value=""
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalled();
      expect(onKeyDown).toHaveBeenCalled();
    });

    test('should handle input with error state', () => {
      const { container } = render(
        <Input {...defaultProps} value="invalid" error={true} />
      );
      const input = container.querySelector('input');
      const label = container.querySelector('label');

      expect(input?.className).toContain('text-red-500');
      expect(label?.className).toContain('text-red-500');
    });

    test('should transition from error to normal state', () => {
      const { rerender, container } = render(
        <Input {...defaultProps} error={true} />
      );

      let input = container.querySelector('input');
      expect(input?.className).toContain('text-red-500');

      rerender(<Input {...defaultProps} error={false} />);
      input = container.querySelector('input');
      expect(input?.className).not.toContain('text-red-500');
    });

    test('should handle all props together', () => {
      const onChange = jest.fn();
      const onKeyDown = jest.fn();
      render(
        <Input
          id="email-input"
          onChange={onChange}
          onKeyDown={onKeyDown}
          value="test@example.com"
          lable="Email Address"
          type="email"
          required={true}
          error={false}
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.id).toBe('email-input');
      expect(input.type).toBe('email');
      expect(input.value).toBe('test@example.com');
      expect(input.required).toBe(true);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });
  });
});
