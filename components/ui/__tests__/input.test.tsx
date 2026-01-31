import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    test('should render without crashing', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    test('should render as input element', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('input')).toBeTruthy();
    });

    test('should accept placeholder text', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
    });

    test('should display initial value', () => {
      render(<Input defaultValue="test value" />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('test value');
    });

    test('should render with type="text" by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.tagName).toBe('INPUT');
    });
  });

  describe('Input Types', () => {
    test('should render text input', () => {
      render(<Input type="text" />);
      expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('text');
    });

    test('should render password input', () => {
      const { container } = render(<Input type="password" />);
      expect(container.querySelector('input[type="password"]')).toBeTruthy();
    });

    test('should render email input', () => {
      const { container } = render(<Input type="email" />);
      expect(container.querySelector('input[type="email"]')).toBeTruthy();
    });

    test('should render number input', () => {
      const { container } = render(<Input type="number" />);
      expect(container.querySelector('input[type="number"]')).toBeTruthy();
    });

    test('should render search input', () => {
      const { container } = render(<Input type="search" />);
      expect(container.querySelector('input[type="search"]')).toBeTruthy();
    });

    test('should render tel input', () => {
      const { container } = render(<Input type="tel" />);
      expect(container.querySelector('input[type="tel"]')).toBeTruthy();
    });

    test('should render url input', () => {
      const { container } = render(<Input type="url" />);
      expect(container.querySelector('input[type="url"]')).toBeTruthy();
    });

    test('should render date input', () => {
      const { container } = render(<Input type="date" />);
      expect(container.querySelector('input[type="date"]')).toBeTruthy();
    });

    test('should render time input', () => {
      const { container } = render(<Input type="time" />);
      expect(container.querySelector('input[type="time"]')).toBeTruthy();
    });

    test('should render datetime-local input', () => {
      const { container } = render(<Input type="datetime-local" />);
      expect(container.querySelector('input[type="datetime-local"]')).toBeTruthy();
    });
  });

  describe('Props and Attributes', () => {
    test('should accept disabled attribute', () => {
      render(<Input disabled />);
      expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    });

    test('should accept required attribute', () => {
      render(<Input required />);
      expect((screen.getByRole('textbox') as HTMLInputElement).required).toBe(true);
    });

    test('should accept min attribute', () => {
      const { container } = render(<Input type="number" min="0" />);
      expect(container.querySelector('input[min="0"]')).toBeTruthy();
    });

    test('should accept max attribute', () => {
      const { container } = render(<Input type="number" max="100" />);
      expect(container.querySelector('input[max="100"]')).toBeTruthy();
    });

    test('should accept step attribute', () => {
      const { container } = render(<Input type="number" step="5" />);
      expect(container.querySelector('input[step="5"]')).toBeTruthy();
    });

    test('should accept pattern attribute', () => {
      const { container } = render(<Input pattern="[0-9]{3}-[0-9]{4}" />);
      expect(container.querySelector('input[pattern="[0-9]{3}-[0-9]{4}"]')).toBeTruthy();
    });

    test('should accept autoComplete attribute', () => {
      const { container } = render(<Input autoComplete="email" />);
      expect(container.querySelector('input[autocomplete="email"]')).toBeTruthy();
    });

    test('should accept name attribute', () => {
      const { container } = render(<Input name="test-input" />);
      expect(container.querySelector('input[name="test-input"]')).toBeTruthy();
    });

    test('should accept id attribute', () => {
      const { container } = render(<Input id="my-input" />);
      expect(container.querySelector('#my-input')).toBeTruthy();
    });

    test('should accept data-testid attribute', () => {
      render(<Input data-testid="custom-input" />);
      expect(screen.getByTestId('custom-input')).toBeTruthy();
    });

    test('should accept aria-label attribute', () => {
      render(<Input aria-label="Custom label" />);
      expect(screen.getByLabelText('Custom label')).toBeTruthy();
    });

    test('should accept aria-describedby attribute', () => {
      const { container } = render(<Input aria-describedby="help-text" />);
      expect(container.querySelector('input[aria-describedby="help-text"]')).toBeTruthy();
    });
  });

  describe('Event Handlers', () => {
    test('should handle onChange event', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    test('should update value on onChange', () => {
      render(<Input defaultValue="" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'hello' } });
      expect(input.value).toBe('hello');
    });

    test('should handle onBlur event', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalled();
    });

    test('should handle onFocus event', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    test('should handle onKeyDown event', () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalled();
    });

    test('should handle onKeyUp event', () => {
      const handleKeyUp = jest.fn();
      render(<Input onKeyUp={handleKeyUp} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.keyUp(input, { key: 'a' });
      
      expect(handleKeyUp).toHaveBeenCalled();
    });

    test('should handle multiple events in sequence', () => {
      const handleFocus = jest.fn();
      const handleChange = jest.fn();
      const handleBlur = jest.fn();
      
      render(<Input onFocus={handleFocus} onChange={handleChange} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.blur(input);
      
      expect(handleFocus).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalled();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    test('should apply default classes', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('flex');
      expect(input?.className).toContain('h-9');
      expect(input?.className).toContain('w-full');
      expect(input?.className).toContain('rounded-md');
      expect(input?.className).toContain('border');
    });

    test('should merge custom className with default classes', () => {
      const { container } = render(<Input className="custom-class" />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('custom-class');
      expect(input?.className).toContain('flex');
    });

    test('should support disabled styling', () => {
      const { container } = render(<Input disabled />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('disabled:');
    });

    test('should support focus-visible ring styling', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('focus-visible:ring');
    });

    test('should have transition classes', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('transition-colors');
      expect(input?.className).toContain('duration-300');
    });

    test('should have placeholder styling', () => {
      const { container } = render(<Input placeholder="Test" />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('placeholder:');
    });

    test('should apply custom className while preserving defaults', () => {
      const { container } = render(<Input className="mt-4 mb-2" />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('mt-4');
      expect(input?.className).toContain('mb-2');
      expect(input?.className).toContain('flex');
    });
  });

  describe('Ref Forwarding', () => {
    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('INPUT');
    });

    test('should allow ref to access input value', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" />);
      expect(ref.current?.value).toBe('test');
    });

    test('should allow ref to focus input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });

    test('should allow ref to set value', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      if (ref.current) {
        ref.current.value = 'new value';
        expect(ref.current.value).toBe('new value');
      }
    });

    test('should allow ref to clear input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" />);
      if (ref.current) {
        ref.current.value = '';
        expect(ref.current.value).toBe('');
      }
    });

    test('should work with useRef hook', () => {
      const TestComponent = () => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <div>
            <Input ref={inputRef} data-testid="test-input" />
            <button onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = 'programmatic value';
              }
            }}>Set Value</button>
          </div>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText('Set Value');
      fireEvent.click(button);
      
      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('programmatic value');
    });
  });

  describe('DisplayName', () => {
    test('should have correct displayName', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string value', () => {
      render(<Input value="" onChange={() => {}} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
    });

    test('should handle very long input value', () => {
      const longValue = 'a'.repeat(1000);
      render(<Input defaultValue={longValue} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(longValue);
    });

    test('should handle special characters in value', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<Input defaultValue={specialValue} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(specialValue);
    });

    test('should handle unicode characters', () => {
      const unicodeValue = '你好世界 🌍 مرحبا';
      render(<Input defaultValue={unicodeValue} />);
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(unicodeValue);
    });

    test('should handle rapid onChange events', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `${i}` } });
      }
      
      expect(handleChange).toHaveBeenCalledTimes(10);
    });

    test('should handle readonly attribute', () => {
      render(<Input readOnly defaultValue="read only" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    test('should handle null onChange', () => {
      render(<Input onChange={undefined} />);
      const input = screen.getByRole('textbox');
      expect(() => {
        fireEvent.change(input, { target: { value: 'test' } });
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label', () => {
      render(<Input aria-label="Email address" />);
      expect(screen.getByLabelText('Email address')).toBeTruthy();
    });

    test('should support aria-describedby', () => {
      const { container } = render(<Input aria-describedby="help-text" />);
      expect(container.querySelector('input[aria-describedby="help-text"]')).toBeTruthy();
    });

    test('should support aria-invalid for error states', () => {
      const { container } = render(<Input aria-invalid="true" />);
      expect(container.querySelector('input[aria-invalid="true"]')).toBeTruthy();
    });

    test('should support aria-required', () => {
      const { container } = render(<Input aria-required="true" />);
      expect(container.querySelector('input[aria-required="true"]')).toBeTruthy();
    });

    test('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    test('should work with external label via htmlFor', () => {
      const { container } = render(
        <div>
          <label htmlFor="email-input">Email</label>
          <Input id="email-input" type="email" />
        </div>
      );
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('email-input');
    });

    test('should be keyboard navigable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    test('should announce placeholder as accessible name', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    test('should accept HTMLInputElement ref type', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    test('should accept standard HTML input attributes', () => {
      const { container } = render(
        <Input
          id="test-id"
          className="custom"
          data-testid="test"
          title="Test Input"
          tabIndex={0}
        />
      );
      expect(container.querySelector('#test-id')).toBeTruthy();
      expect(container.querySelector('[title="Test Input"]')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const CustomInput = React.forwardRef<HTMLInputElement>((props, ref) => (
        <Input ref={ref} {...props} />
      ));

      const ref = React.createRef<HTMLInputElement>();
      render(<CustomInput ref={ref} />);
      expect(ref.current?.tagName).toBe('INPUT');
    });
  });

  describe('Input Methods', () => {
    test('should support blur() method', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} autoFocus />);
      ref.current?.blur();
      expect(document.activeElement).not.toBe(ref.current);
    });

    test('should support select() method', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" />);
      if (ref.current) {
        ref.current.select();
        expect(ref.current.selectionStart).toBe(0);
        expect(ref.current.selectionEnd).toBe(4);
      }
    });

    test('should support setRangeText() method', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="hello world" />);
      ref.current?.setRangeText('wonderful', 6, 11);
      expect(ref.current?.value).toBe('hello wonderful');
    });
  });

  describe('Form Integration', () => {
    test('should work within a form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="test-field" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const button = screen.getByText('Submit') as HTMLButtonElement;
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('should support form data collection', () => {
      const { container } = render(
        <form>
          <Input name="email" defaultValue="test@example.com" />
          <Input name="password" type="password" defaultValue="pass" />
        </form>
      );
      
      const form = container.querySelector('form') as HTMLFormElement;
      const formData = new FormData(form);
      expect(formData.get('email')).toBe('test@example.com');
      expect(formData.get('password')).toBe('pass');
    });

    test('should reset when form is reset', () => {
      const { container } = render(
        <form>
          <Input defaultValue="initial" />
          <button type="reset">Reset</button>
        </form>
      );
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      input.value = 'changed';
      expect(input.value).toBe('changed');
      
      const form = container.querySelector('form') as HTMLFormElement;
      form.reset();
      expect(input.value).toBe('initial');
    });
  });

  describe('Export', () => {
    test('should export Input component', () => {
      expect(Input).toBeTruthy();
    });

    test('should export as forwardRef component', () => {
      expect(typeof Input).toBe('object');
    });
  });
});
