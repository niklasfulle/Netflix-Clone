import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '../badge';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Badge Component', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(<Badge />);
      expect(container).toBeTruthy();
    });

    test('should render as a div element', () => {
      const { container } = render(<Badge>Test Badge</Badge>);
      const badge = container.querySelector('div');
      expect(badge).toBeTruthy();
      expect(badge?.tagName).toBe('DIV');
    });

    test('should render text content', () => {
      render(<Badge>Hello Badge</Badge>);
      expect(screen.getByText('Hello Badge')).toBeTruthy();
    });

    test('should render with default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('inline-flex');
      expect(badge?.className).toContain('items-center');
      expect(badge?.className).toContain('rounded-md');
    });

    test('should render empty badge', () => {
      const { container } = render(<Badge />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should render badge with children elements', () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeTruthy();
      expect(screen.getByText('Text')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    test('should apply default variant by default', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('bg-primary');
      expect(badge?.className).toContain('text-primary-foreground');
    });

    test('should apply secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('bg-secondary');
      expect(badge?.className).toContain('text-secondary-foreground');
    });

    test('should apply destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('bg-destructive');
      expect(badge?.className).toContain('text-destructive-foreground');
    });

    test('should apply outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('text-foreground');
      expect(badge?.className).toContain('border');
    });

    test('should apply success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('bg-emerald-500');
      expect(badge?.className).toContain('text-primary-foreground');
    });

    test('should handle all variants without crashing', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline', 'success'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        expect(container.querySelector('div')).toBeTruthy();
      });
    });
  });

  describe('Styling', () => {
    test('should have base classes', () => {
      const { container } = render(<Badge>Styled</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('inline-flex');
      expect(badge?.className).toContain('items-center');
      expect(badge?.className).toContain('rounded-md');
      expect(badge?.className).toContain('border');
      expect(badge?.className).toContain('px-2.5');
      expect(badge?.className).toContain('py-0.5');
      expect(badge?.className).toContain('text-xs');
      expect(badge?.className).toContain('font-semibold');
      expect(badge?.className).toContain('transition-colors');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <Badge className="custom-class">Merged</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('custom-class');
      expect(badge?.className).toContain('inline-flex');
    });

    test('should merge multiple custom classes', () => {
      const { container } = render(
        <Badge className="class1 class2 class3">Multiple</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('class1');
      expect(badge?.className).toContain('class2');
      expect(badge?.className).toContain('class3');
    });

    test('should handle empty className string', () => {
      const { container } = render(<Badge className="">Empty</Badge>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should support focus styles', () => {
      const { container } = render(<Badge>Focus</Badge>);
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('focus:outline-none');
      expect(badge?.className).toContain('focus:ring-2');
    });

    test('should have shadow on default variant', () => {
      const { container } = render(
        <Badge variant="default">Shadow</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('shadow');
    });

    test('should have hover state', () => {
      const { container } = render(
        <Badge variant="default">Hover</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('hover:bg-primary/80');
    });
  });

  describe('Props', () => {
    test('should pass through HTML attributes', () => {
      const { container } = render(
        <Badge aria-label="test-label" role="status" />
      );
      const badge = container.querySelector('div');
      expect(badge?.getAttribute('aria-label')).toBe('test-label');
      expect(badge?.getAttribute('role')).toBe('status');
    });

    test('should support data attributes', () => {
      const { container } = render(
        <Badge data-testid="custom-badge" data-type="test" />
      );
      const badge = container.querySelector('[data-testid="custom-badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('data-type')).toBe('test');
    });

    test('should support id attribute', () => {
      const { container } = render(<Badge id="badge-1" />);
      expect(container.querySelector('#badge-1')).toBeTruthy();
    });

    test('should support title attribute', () => {
      const { container } = render(<Badge title="Tooltip text" />);
      expect(container.querySelector('[title="Tooltip text"]')).toBeTruthy();
    });

    test('should support custom event handlers', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Badge onClick={handleClick}>Clickable</Badge>
      );
      const badge = container.querySelector('div');
      badge?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should support mouse events', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Badge onClick={handleClick}>Hoverable</Badge>
      );
      const badge = container.querySelector('div');
      badge?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants Export', () => {
    test('should export badgeVariants function', () => {
      expect(badgeVariants).toBeTruthy();
      expect(typeof badgeVariants).toBe('function');
    });

    test('should return classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('inline-flex');
    });

    test('should return classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
    });

    test('should return classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
    });

    test('should return classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });

    test('should return classes for success variant', () => {
      const classes = badgeVariants({ variant: 'success' });
      expect(classes).toContain('bg-emerald-500');
    });

    test('should handle undefined variant (use default)', () => {
      const classes = badgeVariants({});
      expect(classes).toContain('bg-primary');
    });

    test('should include base classes in all variants', () => {
      const baseClasses = ['inline-flex', 'items-center', 'rounded-md', 'border'];
      
      ['default', 'secondary', 'destructive', 'outline', 'success'].forEach((variant: any) => {
        const classes = badgeVariants({ variant });
        baseClasses.forEach(baseClass => {
          expect(classes).toContain(baseClass);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      const { container } = render(<Badge>{null}</Badge>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle undefined children', () => {
      const { container } = render(<Badge>{undefined}</Badge>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle boolean children', () => {
      const { container } = render(
        <Badge>
          {true}
          {false}
        </Badge>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeTruthy();
    });

    test('should handle special characters in content', () => {
      render(<Badge>Badge &lt;test&gt;</Badge>);
      const badge = screen.getByText(/Badge/);
      expect(badge).toBeTruthy();
    });

    test('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle emoji in content', () => {
      render(<Badge>✅ Success</Badge>);
      expect(screen.getByText('✅ Success')).toBeTruthy();
    });

    test('should handle unicode characters', () => {
      render(<Badge>日本語</Badge>);
      expect(screen.getByText('日本語')).toBeTruthy();
    });

    test('should handle whitespace-only children', () => {
      const { container } = render(<Badge>   </Badge>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle className with special characters', () => {
      const { container } = render(
        <Badge className="class-1 class_2 class.3">Test</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('class-1');
      expect(badge?.className).toContain('class_2');
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label', () => {
      const { container } = render(
        <Badge aria-label="Status badge">New</Badge>
      );
      expect(container.querySelector('[aria-label="Status badge"]')).toBeTruthy();
    });

    test('should support aria-describedby', () => {
      const { container } = render(
        <Badge aria-describedby="badge-description">Info</Badge>
      );
      expect(container.querySelector('[aria-describedby="badge-description"]')).toBeTruthy();
    });

    test('should support role attribute', () => {
      const { container } = render(
        <Badge role="status">Status</Badge>
      );
      expect(container.querySelector('[role="status"]')).toBeTruthy();
    });

    test('should support aria-hidden for decorative badges', () => {
      const { container } = render(
        <Badge aria-hidden="true">Decorative</Badge>
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });

    test('should be keyboard accessible with proper focus styles', () => {
      const { container } = render(
        <Badge tabIndex={0}>Focusable</Badge>
      );
      const badge = container.querySelector('[tabindex="0"]');
      expect(badge?.className).toContain('focus:outline-none');
    });

    test('should support semantic HTML', () => {
      const { container } = render(
        <Badge>Text Badge</Badge>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });
  });

  describe('Integration', () => {
    test('should work with complex children', () => {
      const { container } = render(
        <Badge variant="success">
          <span role="img" aria-label="checkmark">✓</span>
          <span>Approved</span>
        </Badge>
      );
      expect(screen.getByText('Approved')).toBeTruthy();
      expect(container.querySelector('[role="img"]')).toBeTruthy();
    });

    test('should work as inline element', () => {
      const { container } = render(
        <div>
          Text before
          <Badge>Inline Badge</Badge>
          Text after
        </div>
      );
      const badges = container.querySelectorAll('div');
      expect(badges.length).toBeGreaterThan(1);
    });

    test('should work in lists', () => {
      render(
        <ul>
          <li>Item 1 <Badge variant="default">New</Badge></li>
          <li>Item 2 <Badge variant="secondary">Sale</Badge></li>
        </ul>
      );
      expect(screen.getByText('New')).toBeTruthy();
      expect(screen.getByText('Sale')).toBeTruthy();
    });

    test('should support nested within buttons', () => {
      render(
        <button>
          Download <Badge variant="success">v2.0</Badge>
        </button>
      );
      expect(screen.getByText('v2.0')).toBeTruthy();
    });

    test('should work with conditional rendering', () => {
      render(
        <div>
          <Badge variant="success">Active</Badge>
          {false && <Badge variant="destructive">Inactive</Badge>}
        </div>
      );
      expect(screen.getByText('Active')).toBeTruthy();
      expect(screen.queryByText('Inactive')).toBeNull();
    });
  });

  describe('Styling Variants with className', () => {
    test('should override variant styles with className', () => {
      const { container } = render(
        <Badge variant="default" className="custom-bg">Override</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('custom-bg');
      expect(badge?.className).toContain('bg-primary');
    });

    test('should support dark mode classes', () => {
      const { container } = render(
        <Badge className="dark:bg-slate-900 dark:text-white">Dark</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('dark:bg-slate-900');
      expect(badge?.className).toContain('dark:text-white');
    });

    test('should support responsive classes', () => {
      const { container } = render(
        <Badge className="sm:px-3 md:px-4 lg:px-5">Responsive</Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('sm:px-3');
      expect(badge?.className).toContain('md:px-4');
      expect(badge?.className).toContain('lg:px-5');
    });

    test('should combine variant and custom styling', () => {
      const { container } = render(
        <Badge 
          variant="secondary" 
          className="uppercase tracking-wide"
        >
          Combined
        </Badge>
      );
      const badge = container.querySelector('div');
      expect(badge?.className).toContain('bg-secondary');
      expect(badge?.className).toContain('uppercase');
      expect(badge?.className).toContain('tracking-wide');
    });
  });

  describe('Type Safety', () => {
    test('should accept BadgeProps interface', () => {
      const props = {
        variant: 'success' as const,
        className: 'custom',
        children: 'Content',
      };
      const { container } = render(<Badge {...props} />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const BadgeWithRef = React.forwardRef<HTMLDivElement, any>((props, ref) => (
        <Badge {...props} />
      ));
      
      React.createRef<HTMLDivElement>();
      const { container } = render(
        <BadgeWithRef>Forward Ref</BadgeWithRef>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });
  });
});
