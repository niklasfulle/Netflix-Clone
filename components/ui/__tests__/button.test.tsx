import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '../button';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock Radix UI Slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: React.forwardRef(({ children, ...props }: any, ref: any) => 
    React.cloneElement(children, { ref, ...props })
  ),
}));

describe('Button Component', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(<Button>Click me</Button>);
      expect(container).toBeTruthy();
    });

    test('should render as a button element by default', () => {
      const { container } = render(<Button>Test</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<Button>Click Button</Button>);
      expect(screen.getByText('Click Button')).toBeTruthy();
    });

    test('should render with default variant and size', () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('inline-flex');
      expect(button?.className).toContain('items-center');
      expect(button?.className).toContain('justify-center');
    });

    test('should render empty button', () => {
      const { container } = render(<Button />);
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should render button with children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeTruthy();
      expect(screen.getByText('Text')).toBeTruthy();
    });

    test('should have displayName', () => {
      expect(Button.displayName).toBe('Button');
    });
  });

  describe('Variants', () => {
    test('should apply default variant by default', () => {
      const { container } = render(<Button variant="default">Default</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-primary');
      expect(button?.className).toContain('text-primary-foreground');
    });

    test('should apply destructive variant', () => {
      const { container } = render(<Button variant="destructive">Delete</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-destructive');
      expect(button?.className).toContain('text-destructive-foreground');
    });

    test('should apply outline variant', () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('border');
      expect(button?.className).toContain('border-input');
      expect(button?.className).toContain('bg-background');
    });

    test('should apply outline_dark variant', () => {
      const { container } = render(<Button variant="outline_dark">Dark Outline</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('border');
      expect(button?.className).toContain('border-white');
      expect(button?.className).toContain('bg-zinc-800');
    });

    test('should apply secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-secondary');
      expect(button?.className).toContain('text-secondary-foreground');
    });

    test('should apply ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:bg-accent');
    });

    test('should apply link variant', () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('text-primary');
      expect(button?.className).toContain('underline-offset-4');
    });

    test('should apply link_dark variant', () => {
      const { container } = render(<Button variant="link_dark">Dark Link</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('text-gray-300');
      expect(button?.className).toContain('underline-offset-4');
    });

    test('should apply auth variant', () => {
      const { container } = render(<Button variant="auth">Login</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('w-full');
      expect(button?.className).toContain('bg-red-600');
      expect(button?.className).toContain('text-white');
    });

    test('should apply save variant', () => {
      const { container } = render(<Button variant="save">Save</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('w-full');
      expect(button?.className).toContain('bg-green-600');
      expect(button?.className).toContain('text-white');
    });

    test('should handle all variants without crashing', () => {
      const variants = ['default', 'destructive', 'outline', 'outline_dark', 'secondary', 'ghost', 'link', 'link_dark', 'auth', 'save'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        expect(container.querySelector('button')).toBeTruthy();
      });
    });
  });

  describe('Sizes', () => {
    test('should apply default size by default', () => {
      const { container } = render(<Button size="default">Default Size</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-9');
      expect(button?.className).toContain('px-4');
      expect(button?.className).toContain('py-2');
    });

    test('should apply sm size', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-8');
      expect(button?.className).toContain('px-3');
      expect(button?.className).toContain('text-xs');
    });

    test('should apply lg size', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-10');
      expect(button?.className).toContain('px-8');
    });

    test('should apply icon size', () => {
      const { container } = render(<Button size="icon">🔍</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-9');
      expect(button?.className).toContain('w-9');
    });

    test('should handle all sizes without crashing', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;
      
      sizes.forEach(size => {
        const { container } = render(<Button size={size}>{size}</Button>);
        expect(container.querySelector('button')).toBeTruthy();
      });
    });
  });

  describe('Props', () => {
    test('should pass through HTML button attributes', () => {
      const { container } = render(
        <Button aria-label="Submit form" type="submit" />
      );
      const button = container.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBe('Submit form');
      expect(button?.getAttribute('type')).toBe('submit');
    });

    test('should support data attributes', () => {
      const { container } = render(
        <Button data-testid="custom-button" data-action="submit" />
      );
      const button = container.querySelector('[data-testid="custom-button"]');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('data-action')).toBe('submit');
    });

    test('should support disabled attribute', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');
      expect(button?.getAttribute('disabled')).toBe('');
      expect(button?.className).toContain('disabled:pointer-events-none');
      expect(button?.className).toContain('disabled:opacity-50');
    });

    test('should support different button types', () => {
      const { container: submitContainer } = render(<Button type="submit">Submit</Button>);
      expect(submitContainer.querySelector('[type="submit"]')).toBeTruthy();

      const { container: resetContainer } = render(<Button type="reset">Reset</Button>);
      expect(resetContainer.querySelector('[type="reset"]')).toBeTruthy();

      const { container: buttonContainer } = render(<Button type="button">Button</Button>);
      expect(buttonContainer.querySelector('[type="button"]')).toBeTruthy();
    });

    test('should support click handlers', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Button onClick={handleClick}>Clickable</Button>
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should not trigger click when disabled', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Button onClick={handleClick} disabled>
          Disabled Click
        </Button>
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should support title attribute', () => {
      const { container } = render(
        <Button title="Click to submit">Submit</Button>
      );
      expect(container.querySelector('[title="Click to submit"]')).toBeTruthy();
    });

    test('should support id attribute', () => {
      const { container } = render(<Button id="submit-btn">Submit</Button>);
      expect(container.querySelector('#submit-btn')).toBeTruthy();
    });
  });

  describe('Custom className', () => {
    test('should merge custom className with variant classes', () => {
      const { container } = render(
        <Button className="custom-class">Merged</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-class');
      expect(button?.className).toContain('bg-primary');
    });

    test('should merge custom className with size classes', () => {
      const { container } = render(
        <Button size="lg" className="custom-padding">Large</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-padding');
      expect(button?.className).toContain('h-10');
    });

    test('should merge multiple custom classes', () => {
      const { container } = render(
        <Button className="class1 class2 class3">Multiple</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('class1');
      expect(button?.className).toContain('class2');
      expect(button?.className).toContain('class3');
    });

    test('should support dark mode classes', () => {
      const { container } = render(
        <Button className="dark:bg-slate-900 dark:text-white">Dark</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('dark:bg-slate-900');
      expect(button?.className).toContain('dark:text-white');
    });

    test('should support responsive classes', () => {
      const { container } = render(
        <Button className="sm:w-full md:w-auto lg:px-8">Responsive</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('sm:w-full');
      expect(button?.className).toContain('md:w-auto');
      expect(button?.className).toContain('lg:px-8');
    });
  });

  describe('asChild Prop', () => {
    test('should render as a custom element when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(container.querySelector('a')).toBeTruthy();
      expect(screen.getByText('Link Button')).toBeTruthy();
    });

    test('should apply button styles to child element', () => {
      const { container } = render(
        <Button asChild variant="default" size="default">
          <a href="/test">Link</a>
        </Button>
      );
      const link = container.querySelector('a');
      expect(link?.className).toContain('inline-flex');
      expect(link?.className).toContain('items-center');
    });

    test('should forward ref to child element when asChild is true', () => {
      const ref = React.createRef<HTMLElement>();
      render(
        <Button asChild ref={ref as React.Ref<HTMLButtonElement>}>
          <a href="/test">Link</a>
        </Button>
      );
      expect(ref.current?.tagName).toBe('A');
      expect((ref.current as HTMLAnchorElement)?.href).toContain('/test');
    });

    test('should work with multiple asChild children', () => {
      render(
        <Button asChild>
          <span>
            <span>Nested</span>
          </span>
        </Button>
      );
      expect(screen.getByText('Nested')).toBeTruthy();
    });
  });

  describe('Ref Forwarding', () => {
    test('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('BUTTON');
    });

    test('should allow ref to be accessed and clicked', () => {
      const ref = React.createRef<HTMLButtonElement>();
      const handleClick = jest.fn();
      render(
        <Button ref={ref} onClick={handleClick}>
          Ref Click
        </Button>
      );
      ref.current?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should allow ref to access button properties', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <Button ref={ref} type="submit" disabled>
          Ref Props
        </Button>
      );
      expect(ref.current?.type).toBe('submit');
      expect(ref.current?.disabled).toBe(true);
    });
  });

  describe('Styling Properties', () => {
    test('should have base transition classes', () => {
      const { container } = render(<Button>Transition</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('transition-colors');
      expect(button?.className).toContain('transition-all');
      expect(button?.className).toContain('duration-300');
    });

    test('should have focus-visible styles', () => {
      const { container } = render(<Button>Focus</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('focus-visible:outline-none');
      expect(button?.className).toContain('focus-visible:ring-1');
    });

    test('should have whitespace-nowrap', () => {
      const { container } = render(<Button>No Wrap</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('whitespace-nowrap');
    });

    test('should be rounded medium by default', () => {
      const { container } = render(<Button>Rounded</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('rounded-md');
    });

    test('should have text-sm font-medium by default', () => {
      const { container } = render(<Button>Text</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('text-sm');
      expect(button?.className).toContain('font-medium');
    });

    test('should have shadow on default variant', () => {
      const { container } = render(
        <Button variant="default">Shadow</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('shadow');
    });

    test('should have hover states', () => {
      const { container } = render(
        <Button variant="default">Hover</Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:bg-primary/90');
    });
  });

  describe('buttonVariants Export', () => {
    test('should export buttonVariants function', () => {
      expect(buttonVariants).toBeTruthy();
      expect(typeof buttonVariants).toBe('function');
    });

    test('should return classes for default variant and size', () => {
      const classes = buttonVariants({ variant: 'default', size: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-9');
    });

    test('should return classes for all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'outline_dark', 'secondary', 'ghost', 'link', 'link_dark', 'auth', 'save'] as const;
      
      variants.forEach(variant => {
        const classes = buttonVariants({ variant });
        expect(classes).toBeTruthy();
        expect(classes.length).toBeGreaterThan(0);
      });
    });

    test('should return classes for all sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;
      
      sizes.forEach(size => {
        const classes = buttonVariants({ size });
        expect(classes).toBeTruthy();
      });
    });

    test('should include base classes in all variants', () => {
      const baseClasses = ['inline-flex', 'items-center', 'justify-center', 'whitespace-nowrap', 'rounded-md'];
      
      ['default', 'destructive', 'outline'].forEach((variant: any) => {
        const classes = buttonVariants({ variant });
        baseClasses.forEach(baseClass => {
          expect(classes).toContain(baseClass);
        });
      });
    });

    test('should handle undefined variant and size (use defaults)', () => {
      const classes = buttonVariants({});
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-9');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      const { container } = render(<Button>{null}</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should handle undefined children', () => {
      const { container } = render(<Button>{undefined}</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should handle boolean children', () => {
      const { container } = render(
        <Button>
          {true}
          {false}
        </Button>
      );
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should handle numeric content', () => {
      render(<Button>42</Button>);
      expect(screen.getByText('42')).toBeTruthy();
    });

    test('should handle emoji in content', () => {
      render(<Button>✅ Success</Button>);
      expect(screen.getByText('✅ Success')).toBeTruthy();
    });

    test('should handle unicode characters', () => {
      render(<Button>日本語</Button>);
      expect(screen.getByText('日本語')).toBeTruthy();
    });

    test('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle empty className', () => {
      const { container } = render(<Button className="">Empty</Button>);
      expect(container.querySelector('button')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label', () => {
      const { container } = render(
        <Button aria-label="Submit form">Submit</Button>
      );
      expect(container.querySelector('[aria-label="Submit form"]')).toBeTruthy();
    });

    test('should support aria-describedby', () => {
      const { container } = render(
        <Button aria-describedby="help-text">Help</Button>
      );
      expect(container.querySelector('[aria-describedby="help-text"]')).toBeTruthy();
    });

    test('should support role attribute', () => {
      const { container } = render(
        <Button role="tab">Tab</Button>
      );
      expect(container.querySelector('[role="tab"]')).toBeTruthy();
    });

    test('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Button onClick={handleClick}>Keyboard</Button>
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(handleClick).toHaveBeenCalled();
    });

    test('should support aria-pressed for toggle buttons', () => {
      const { container } = render(
        <Button aria-pressed="false">Toggle</Button>
      );
      expect(container.querySelector('[aria-pressed="false"]')).toBeTruthy();
    });

    test('should announce disabled state to assistive technology', () => {
      const { container } = render(
        <Button disabled>Disabled</Button>
      );
      const button = container.querySelector('button');
      expect(button?.disabled).toBe(true);
    });
  });

  describe('Integration', () => {
    test('should work with complex children', () => {
      const { container } = render(
        <Button variant="default" size="lg">
          <span role="img" aria-label="checkmark">✓</span>
          <span>Confirm</span>
        </Button>
      );
      expect(screen.getByText('Confirm')).toBeTruthy();
      expect(container.querySelector('[role="img"]')).toBeTruthy();
    });

    test('should work in a form submission context', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const { container } = render(
        <form onSubmit={handleSubmit}>
          <input type="text" />
          <Button type="submit">Submit</Button>
        </form>
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('should work with conditional rendering', () => {
      render(
        <div>
          <Button variant="default">Visible</Button>
          {false && <Button variant="secondary">Hidden</Button>}
        </div>
      );
      expect(screen.getByText('Visible')).toBeTruthy();
      expect(screen.queryByText('Hidden')).toBeNull();
    });

    test('should work in multiple instances', () => {
      render(
        <>
          <Button variant="default">Save</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </>
      );
      expect(screen.getByText('Save')).toBeTruthy();
      expect(screen.getByText('Cancel')).toBeTruthy();
      expect(screen.getByText('Delete')).toBeTruthy();
    });

    test('should work with event propagation', () => {
      const handleParentClick = jest.fn();
      const handleButtonClick = jest.fn();
      const { container } = render(
        <div onClick={handleParentClick}>
          <Button onClick={handleButtonClick}>Child</Button>
        </div>
      );
      const button = container.querySelector('button');
      fireEvent.click(button!);
      expect(handleButtonClick).toHaveBeenCalled();
      expect(handleParentClick).toHaveBeenCalled();
    });
  });

  describe('Variant + Size Combinations', () => {
    test('should combine variant and size correctly', () => {
      const { container } = render(
        <Button variant="destructive" size="lg">
          Delete
        </Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-destructive');
      expect(button?.className).toContain('h-10');
      expect(button?.className).toContain('px-8');
    });

    test('should work with auth variant and custom size', () => {
      const { container } = render(
        <Button variant="auth" size="default">
          Login
        </Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-red-600');
      expect(button?.className).toContain('w-full');
    });

    test('should work with ghost variant and icon size', () => {
      const { container } = render(
        <Button variant="ghost" size="icon">
          🔍
        </Button>
      );
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:bg-accent');
      expect(button?.className).toContain('h-9');
      expect(button?.className).toContain('w-9');
    });
  });

  describe('Type Safety', () => {
    test('should accept ButtonProps interface', () => {
      const props = {
        variant: 'default' as const,
        size: 'lg' as const,
        className: 'custom',
        children: 'Content',
        onClick: jest.fn(),
      };
      const { container } = render(<Button {...props} />);
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const CustomButton = React.forwardRef<HTMLButtonElement, any>((props, ref) => (
        <Button ref={ref} {...props} />
      ));
      
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <CustomButton ref={ref}>Forward Ref</CustomButton>
      );
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });
});
