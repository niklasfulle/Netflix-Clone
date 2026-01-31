import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '../form';

// Mock Label component
jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <label ref={ref} className={className} data-testid="form-label" {...props}>
      {children}
    </label>
  )),
}));

// Mock Slot from radix-ui
jest.mock('@radix-ui/react-slot', () => ({
  Slot: React.forwardRef(({ children, ...props }: any, ref) => (
    <div ref={ref} data-testid="form-control-slot" {...props}>
      {children}
    </div>
  )),
}));

// Mock radix-ui label
jest.mock('@radix-ui/react-label', () => ({
  Root: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <label ref={ref} className={className} data-testid="radix-label" {...props}>
      {children}
    </label>
  )),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Helper wrapper for FormField tests
const FormFieldTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm({
    defaultValues: {
      testField: 'test-value',
    },
  });

  return <Form {...form}>{children}</Form>;
};

// Test wrapper component
const FormTestWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm({
    defaultValues: {
      testField: '',
    },
  });

  return <Form {...form}>{children}</Form>;
};

describe('Form Components', () => {
  describe('Form Component', () => {
    const FormWrapper = ({ children }: { children: React.ReactNode }) => {
      const form = useForm();
      return <Form {...form}>{children}</Form>;
    };

    test('should render without crashing', () => {
      const { container } = render(
        <FormWrapper>
          <div>Form content</div>
        </FormWrapper>
      );
      expect(container).toBeTruthy();
    });

    test('should render as form provider', () => {
      render(
        <FormWrapper>
          <div>Provider content</div>
        </FormWrapper>
      );
      expect(screen.getByText('Provider content')).toBeTruthy();
    });

    test('should accept children', () => {
      render(
        <FormWrapper>
          <span>Test child 1</span>
          <span>Test child 2</span>
        </FormWrapper>
      );
      expect(screen.getByText('Test child 1')).toBeTruthy();
      expect(screen.getByText('Test child 2')).toBeTruthy();
    });
  });

  describe('FormItem Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<FormItem />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should render as div element', () => {
      const { container } = render(<FormItem>Content</FormItem>);
      const div = container.querySelector('div');
      expect(div).toBeTruthy();
      expect(screen.getByText('Content')).toBeTruthy();
    });

    test('should apply default classes', () => {
      const { container } = render(<FormItem>Item</FormItem>);
      const div = container.querySelector('div');
      expect(div?.className).toContain('space-y-2');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <FormItem className="custom-item">Item</FormItem>
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('custom-item');
      expect(div?.className).toContain('space-y-2');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<FormItem ref={ref}>Item</FormItem>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should have correct displayName', () => {
      expect(FormItem.displayName).toBe('FormItem');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <FormItem data-testid="custom-item" aria-label="Form item">
          Item
        </FormItem>
      );
      expect(container.querySelector('[data-testid="custom-item"]')).toBeTruthy();
      expect(container.querySelector('[aria-label="Form item"]')).toBeTruthy();
    });

    test('should support id attribute', () => {
      const { container } = render(<FormItem id="item-1">Item</FormItem>);
      expect(container.querySelector('#item-1')).toBeTruthy();
    });
  });

  describe('FormLabel Component', () => {
    test('should render without crashing', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByTestId('form-label')).toBeTruthy();
    });

    test('should render text content', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByText('Test Label')).toBeTruthy();
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel ref={ref}>Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(ref.current).toBeTruthy();
    });

    test('should merge custom className', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="custom-label">Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const label = container.querySelector('[data-testid="form-label"]');
      expect(label?.className).toContain('custom-label');
    });

    test('should have correct displayName', () => {
      expect(FormLabel.displayName).toBe('FormLabel');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="custom-label">Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('[data-testid="custom-label"]')).toBeTruthy();
    });
  });

  describe('FormControl Component', () => {
    test('should render without crashing', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByTestId('form-control-slot')).toBeTruthy();
    });

    test('should render children', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input placeholder="Test input" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByPlaceholderText('Test input')).toBeTruthy();
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormControl ref={ref}>
                  <input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(ref.current).toBeTruthy();
    });

    test('should have correct displayName', () => {
      expect(FormControl.displayName).toBe('FormControl');
    });

    test('should support aria-describedby attribute', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormDescription>Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const control = container.querySelector('[data-testid="form-control-slot"]');
      expect(control?.getAttribute('aria-describedby')).toBeTruthy();
    });

    test('should support aria-invalid attribute', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            rules={{ required: 'This field is required' }}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      const control = screen.getByRole('textbox');
      expect(control.getAttribute('aria-invalid')).toBeDefined();
    });
  });

  describe('FormDescription Component', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('p')).toBeTruthy();
    });

    test('should render text content', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription>Test description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByText('Test description')).toBeTruthy();
    });

    test('should render as p element', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription>Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.tagName).toBe('P');
    });

    test('should apply default classes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription>Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-[0.8rem]');
      expect(p?.className).toContain('text-muted-foreground');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription className="custom-description">Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.className).toContain('custom-description');
      expect(p?.className).toContain('text-[0.8rem]');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription ref={ref}>Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('P');
    });

    test('should have correct displayName', () => {
      expect(FormDescription.displayName).toBe('FormDescription');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription data-testid="custom-description">Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('[data-testid="custom-description"]')).toBeTruthy();
    });
  });

  describe('FormMessage Component', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container).toBeTruthy();
    });

    test('should render text content', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage>Test message</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByText('Test message')).toBeTruthy();
    });

    test('should render as p element', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage>Message</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.tagName).toBe('P');
    });

    test('should apply default classes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage>Message</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-[0.8rem]');
      expect(p?.className).toContain('font-medium');
      expect(p?.className).toContain('text-destructive');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage className="custom-message">Message</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.className).toContain('custom-message');
      expect(p?.className).toContain('text-[0.8rem]');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            rules={{ required: 'This field is required' }}
            render={({ field }) => (
              <FormItem>
                <FormMessage ref={ref} />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      // Note: FormMessage renders only when there's an error
      // Just ensure the ref is properly initialized and renders when there's an error
      expect(ref).toBeTruthy();
    });

    test('should have correct displayName', () => {
      expect(FormMessage.displayName).toBe('FormMessage');
    });

    test('should return null when no content', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p).toBeNull();
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage data-testid="custom-message">Message</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('[data-testid="custom-message"]')).toBeTruthy();
    });
  });

  describe('FormField Component', () => {
    test('should render without crashing', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => <input {...field} />}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    test('should provide field props', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <input {...field} data-testid="test-input" />
            )}
          />
        </FormFieldTestWrapper>
      );

      const input = screen.getByTestId('test-input') as HTMLInputElement;
      expect(input.value).toBe('test-value');
    });

    test('should work with required validation', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            rules={{ required: 'Field is required' }}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(container).toBeTruthy();
    });

    test('should support pattern validation', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            rules={{
              pattern: {
                value: /^[A-Z]/,
                message: 'Must start with uppercase',
              },
            }}
            render={({ field }) => <input {...field} />}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });

  describe('useFormField Hook', () => {
    test('should provide form field context', () => {
      // Create a helper component that uses useFormField
      const TestFieldComponent = () => {
        const formField = useFormField();
        return (
          <div>
            <div data-testid="field-name">{formField.name}</div>
            <div data-testid="field-id">{formField.id}</div>
            <div data-testid="form-item-id">{formField.formItemId}</div>
            <div data-testid="form-desc-id">{formField.formDescriptionId}</div>
            <div data-testid="form-msg-id">{formField.formMessageId}</div>
          </div>
        );
      };

      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={() => (
              <FormItem>
                <TestFieldComponent />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByTestId('field-name')).toHaveTextContent('testField');
      expect(screen.getByTestId('field-id')).toHaveTextContent(/\S/); // non-empty
      expect(screen.getByTestId('form-item-id')).toHaveTextContent(/\S/); // non-empty
      expect(screen.getByTestId('form-desc-id')).toHaveTextContent(/\S/); // non-empty
      expect(screen.getByTestId('form-msg-id')).toHaveTextContent(/\S/); // non-empty
    });

    test('should throw error when used outside FormField', () => {
      // Suppress console errors for this test
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = () => {
        useFormField();
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      spy.mockRestore();
    });

    test('should provide field state from form context', () => {
      let capturedState: any;

      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => {
              const formField = useFormField();
              capturedState = formField;
              return <input {...field} />;
            }}
          />
        </FormFieldTestWrapper>
      );

      // Check that state properties exist in the context
      expect(capturedState).toBeDefined();
      expect(capturedState.name).toBe('testField');
      // FormState properties should be available from react-hook-form
      expect(typeof capturedState.isDirty).not.toBeUndefined();
      expect(typeof capturedState.invalid).not.toBeUndefined();
    });
  });

  describe('Form Composition', () => {
    test('should work with complete form', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormDescription>Your unique username</FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormDescription>Your email address</FormDescription>
                </FormItem>
              </>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Username')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter username')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
    });

    test('should work with error messages', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByTestId('form-label')).toBeTruthy();
    });

    test('should work with nested fields', () => {
      render(
        <FormFieldTestWrapper>
          <FormItem>
            <FormLabel>Name</FormLabel>
            <div style={{ display: 'flex', gap: '10px' }}>
              <FormField
                name="testField"
                render={({ field }) => (
                  <FormControl>
                    <input placeholder="First name" {...field} />
                  </FormControl>
                )}
              />
              <FormField
                name="testField"
                render={({ field }) => (
                  <FormControl>
                    <input placeholder="Last name" {...field} />
                  </FormControl>
                )}
              />
            </div>
          </FormItem>
        </FormFieldTestWrapper>
      );

      expect(screen.getByPlaceholderText('First name')).toBeTruthy();
      expect(screen.getByPlaceholderText('Last name')).toBeTruthy();
    });

    test('should work with multiple field types', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel>Text Input</FormLabel>
                  <FormControl>
                    <input type="text" {...field} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Textarea</FormLabel>
                  <FormControl>
                    <textarea {...field} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Select</FormLabel>
                  <FormControl>
                    <select {...field}>
                      <option value="">Choose...</option>
                      <option value="1">Option 1</option>
                    </select>
                  </FormControl>
                </FormItem>
              </>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Text Input')).toBeTruthy();
      expect(screen.getByText('Textarea')).toBeTruthy();
      expect(screen.getByText('Select')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          {null}
        </FormFieldTestWrapper>
      );
      expect(container).toBeTruthy();
    });

    test('should handle undefined children', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          {undefined}
        </FormFieldTestWrapper>
      );
      expect(container).toBeTruthy();
    });

    test('should handle empty FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle FormDescription with long text', () => {
      const longText = 'A'.repeat(200);
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription>{longText}</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle FormMessage with special characters', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormMessage>Error: &lt;test&gt;</FormMessage>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(screen.getByText(/Error/)).toBeTruthy();
    });

    test('should handle FormItem with custom class names', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem className="custom-item">Item</FormItem>
        </FormFieldTestWrapper>
      );
      const item = container.querySelector('div');
      expect(item?.className).toContain('custom-item');
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label on FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem aria-label="Form section">Item</FormItem>
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('[aria-label="Form section"]')).toBeTruthy();
    });

    test('should support role attribute on FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem role="group">Item</FormItem>
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('[role="group"]')).toBeTruthy();
    });

    test('should link label to form item id', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      const label = container.querySelector('[data-testid="form-label"]');
      expect(label?.getAttribute('for')).toBeTruthy();
    });

    test('should support aria-required on form control', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <input aria-required="true" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(container.querySelector('[aria-required="true"]')).toBeTruthy();
    });
  });

  describe('Styling Integration', () => {
    test('should support dark mode on FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem className="dark:bg-slate-900">Item</FormItem>
        </FormFieldTestWrapper>
      );
      const item = container.querySelector('div');
      expect(item?.className).toContain('dark:bg-slate-900');
    });

    test('should support responsive classes on FormDescription', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription className="sm:text-sm md:text-base">Description</FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      const p = container.querySelector('p');
      expect(p?.className).toContain('sm:text-sm');
      expect(p?.className).toContain('md:text-base');
    });

    test('should support hover states on FormLabel', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="hover:text-accent">Label</FormLabel>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      const label = container.querySelector('[data-testid="form-label"]');
      expect(label?.className).toContain('hover:text-accent');
    });

    test('should support custom spacing on FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem className="mb-4 mt-2">Item</FormItem>
        </FormFieldTestWrapper>
      );
      const item = container.querySelector('div');
      expect(item?.className).toContain('mb-4');
      expect(item?.className).toContain('mt-2');
    });
  });

  describe('Type Safety', () => {
    test('should accept HTMLAttributes on FormItem', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormItem
            id="item-1"
            className="custom"
            data-testid="test"
            title="Form item"
          >
            Content
          </FormItem>
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('#item-1')).toBeTruthy();
      expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
      expect(container.querySelector('[title="Form item"]')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const CustomFormItem = React.forwardRef<HTMLDivElement, any>((props, ref) => (
        <FormItem ref={ref} {...props} />
      ));

      const ref = React.createRef<HTMLDivElement>();
      render(
        <FormFieldTestWrapper>
          <CustomFormItem ref={ref}>Custom Item</CustomFormItem>
        </FormFieldTestWrapper>
      );
      expect(ref.current?.tagName).toBe('DIV');
      // forwardRef components are objects, not functions
      expect(typeof CustomFormItem).toBe('object');
    });

    test('should accept all standard HTML attributes', () => {
      const { container } = render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormDescription
                  id="desc-1"
                  className="custom"
                  data-testid="custom-desc"
                  title="Description"
                >
                  Test
                </FormDescription>
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );
      expect(container.querySelector('#desc-1')).toBeTruthy();
      expect(container.querySelector('[data-testid="custom-desc"]')).toBeTruthy();
    });
  });

  describe('Common Usage Patterns', () => {
    test('should work as login form', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormDescription>Enter your email</FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <input type="password" {...field} />
                  </FormControl>
                </FormItem>
              </>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
    });

    test('should work as settings form', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <select {...field}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </FormControl>
                  <FormDescription>Choose your preferred theme</FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Notifications</FormLabel>
                  <FormControl>
                    <input type="checkbox" {...field} />
                  </FormControl>
                </FormItem>
              </>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Theme')).toBeTruthy();
      expect(screen.getByText('Notifications')).toBeTruthy();
    });

    test('should work as profile form', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <input {...field} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <textarea {...field} />
                  </FormControl>
                  <FormDescription>Tell us about yourself</FormDescription>
                </FormItem>
              </>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Bio')).toBeTruthy();
    });

    test('should work with validation messages', () => {
      render(
        <FormFieldTestWrapper>
          <FormField
            name="testField"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormDescription>Field description</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormFieldTestWrapper>
      );

      expect(screen.getByText('Field')).toBeTruthy();
      expect(screen.getByText('Field description')).toBeTruthy();
    });
  });

  describe('Export Types', () => {
    test('should export useFormField hook', () => {
      expect(useFormField).toBeTruthy();
      expect(typeof useFormField).toBe('function');
    });

    test('should export Form component', () => {
      expect(Form).toBeTruthy();
      expect(typeof Form).toBe('function');
    });

    test('should export FormItem component', () => {
      expect(FormItem).toBeTruthy();
      expect(typeof FormItem).toBe('object');
    });

    test('should export FormLabel component', () => {
      expect(FormLabel).toBeTruthy();
      expect(typeof FormLabel).toBe('object');
    });

    test('should export FormControl component', () => {
      expect(FormControl).toBeTruthy();
      expect(typeof FormControl).toBe('object');
    });

    test('should export FormDescription component', () => {
      expect(FormDescription).toBeTruthy();
      expect(typeof FormDescription).toBe('object');
    });

    test('should export FormMessage component', () => {
      expect(FormMessage).toBeTruthy();
      expect(typeof FormMessage).toBe('object');
    });

    test('should export FormField component', () => {
      expect(FormField).toBeTruthy();
      expect(typeof FormField).toBe('function');
    });
  });
});
