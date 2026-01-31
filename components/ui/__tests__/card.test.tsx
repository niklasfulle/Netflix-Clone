import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Card Components', () => {
  describe('Card Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<Card />);
      expect(container).toBeTruthy();
    });

    test('should render as a div element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeTruthy();
    });

    test('should apply default Card classes', () => {
      const { container } = render(<Card>Styled</Card>);
      const card = container.querySelector('div');
      expect(card?.className).toContain('rounded-xl');
      expect(card?.className).toContain('border');
      expect(card?.className).toContain('bg-card');
      expect(card?.className).toContain('text-card-foreground');
      expect(card?.className).toContain('shadow');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <Card className="custom-card">Content</Card>
      );
      const card = container.querySelector('div');
      expect(card?.className).toContain('custom-card');
      expect(card?.className).toContain('rounded-xl');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <Card data-testid="card" aria-label="Card section" />
      );
      expect(container.querySelector('[data-testid="card"]')).toBeTruthy();
      expect(container.querySelector('[aria-label="Card section"]')).toBeTruthy();
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Ref Card</Card>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should have correct displayName', () => {
      expect(Card.displayName).toBe('Card');
    });

    test('should render children elements', () => {
      render(
        <Card>
          <span>Child 1</span>
          <span>Child 2</span>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeTruthy();
      expect(screen.getByText('Child 2')).toBeTruthy();
    });

    test('should support id attribute', () => {
      const { container } = render(<Card id="card-1">Card</Card>);
      expect(container.querySelector('#card-1')).toBeTruthy();
    });

    test('should support title attribute', () => {
      const { container } = render(
        <Card title="Tooltip text">Card</Card>
      );
      expect(container.querySelector('[title="Tooltip text"]')).toBeTruthy();
    });
  });

  describe('CardHeader Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<CardHeader />);
      expect(container).toBeTruthy();
    });

    test('should render as a div element', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should apply default CardHeader classes', () => {
      const { container } = render(<CardHeader>Styled</CardHeader>);
      const header = container.querySelector('div');
      expect(header?.className).toContain('flex');
      expect(header?.className).toContain('flex-col');
      expect(header?.className).toContain('space-y-1.5');
      expect(header?.className).toContain('p-6');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">Content</CardHeader>
      );
      const header = container.querySelector('div');
      expect(header?.className).toContain('custom-header');
      expect(header?.className).toContain('p-6');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should have correct displayName', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <CardHeader data-testid="header" />
      );
      expect(container.querySelector('[data-testid="header"]')).toBeTruthy();
    });
  });

  describe('CardTitle Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<CardTitle />);
      expect(container).toBeTruthy();
    });

    test('should render as an h3 element', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('h3');
      expect(title).toBeTruthy();
      expect(title?.tagName).toBe('H3');
    });

    test('should render text content', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeTruthy();
    });

    test('should apply default CardTitle classes', () => {
      const { container } = render(<CardTitle>Styled</CardTitle>);
      const title = container.querySelector('h3');
      expect(title?.className).toContain('font-semibold');
      expect(title?.className).toContain('leading-none');
      expect(title?.className).toContain('tracking-tight');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <CardTitle className="text-xl">Title</CardTitle>
      );
      const title = container.querySelector('h3');
      expect(title?.className).toContain('text-xl');
      expect(title?.className).toContain('font-semibold');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('H3');
    });

    test('should have correct displayName', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });

    test('should support children as elements', () => {
      render(
        <CardTitle>
          <span>Styled Title</span>
        </CardTitle>
      );
      expect(screen.getByText('Styled Title')).toBeTruthy();
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <CardTitle aria-label="Main title" />
      );
      expect(container.querySelector('[aria-label="Main title"]')).toBeTruthy();
    });
  });

  describe('CardDescription Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<CardDescription />);
      expect(container).toBeTruthy();
    });

    test('should render as a p element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const desc = container.querySelector('p');
      expect(desc).toBeTruthy();
      expect(desc?.tagName).toBe('P');
    });

    test('should render text content', () => {
      render(<CardDescription>Card Description</CardDescription>);
      expect(screen.getByText('Card Description')).toBeTruthy();
    });

    test('should apply default CardDescription classes', () => {
      const { container } = render(<CardDescription>Styled</CardDescription>);
      const desc = container.querySelector('p');
      expect(desc?.className).toContain('text-sm');
      expect(desc?.className).toContain('text-muted-foreground');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <CardDescription className="text-gray-500">Description</CardDescription>
      );
      const desc = container.querySelector('p');
      expect(desc?.className).toContain('text-gray-500');
      expect(desc?.className).toContain('text-sm');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('P');
    });

    test('should have correct displayName', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <CardDescription data-testid="description" />
      );
      expect(container.querySelector('[data-testid="description"]')).toBeTruthy();
    });
  });

  describe('CardContent Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<CardContent />);
      expect(container).toBeTruthy();
    });

    test('should render as a div element', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should apply default CardContent classes', () => {
      const { container } = render(<CardContent>Styled</CardContent>);
      const content = container.querySelector('div');
      expect(content?.className).toContain('p-6');
      expect(content?.className).toContain('pt-0');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      const content = container.querySelector('div');
      expect(content?.className).toContain('custom-content');
      expect(content?.className).toContain('p-6');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should have correct displayName', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <CardContent data-testid="content" />
      );
      expect(container.querySelector('[data-testid="content"]')).toBeTruthy();
    });
  });

  describe('CardFooter Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<CardFooter />);
      expect(container).toBeTruthy();
    });

    test('should render as a div element', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should apply default CardFooter classes', () => {
      const { container } = render(<CardFooter>Styled</CardFooter>);
      const footer = container.querySelector('div');
      expect(footer?.className).toContain('flex');
      expect(footer?.className).toContain('items-center');
      expect(footer?.className).toContain('p-6');
      expect(footer?.className).toContain('pt-0');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      const footer = container.querySelector('div');
      expect(footer?.className).toContain('custom-footer');
      expect(footer?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should have correct displayName', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });

    test('should pass through HTML attributes', () => {
      const { container } = render(
        <CardFooter data-testid="footer" />
      );
      expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
    });
  });

  describe('Card Composition', () => {
    test('should work with all components together', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Main Content</CardContent>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeTruthy();
      expect(screen.getByText('Card Description')).toBeTruthy();
      expect(screen.getByText('Main Content')).toBeTruthy();
      expect(screen.getByText('Footer Content')).toBeTruthy();
      expect(container.querySelector('[role="contentinfo"]')).toBeNull(); // footer should not have role
    });

    test('should work with partial composition', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>Just Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title Only')).toBeTruthy();
      expect(screen.getByText('Just Content')).toBeTruthy();
    });

    test('should work with custom styling on composition', () => {
      const { container } = render(
        <Card className="bg-blue-50">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Styled</CardTitle>
          </CardHeader>
          <CardContent className="py-8">Content</CardContent>
        </Card>
      );

      const card = container.querySelector('div');
      expect(card?.className).toContain('bg-blue-50');
    });

    test('should work with multiple cards', () => {
      const { container } = render(
        <>
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
          </Card>
        </>
      );

      expect(screen.getByText('Card 1')).toBeTruthy();
      expect(screen.getByText('Card 2')).toBeTruthy();
      const cards = container.querySelectorAll('.rounded-xl');
      expect(cards.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      const { container } = render(<Card>{null}</Card>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle undefined children', () => {
      const { container } = render(<Card>{undefined}</Card>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle boolean children', () => {
      const { container } = render(
        <Card>
          {true}
          {false}
        </Card>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle empty className', () => {
      const { container } = render(<Card className="">Empty</Card>);
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should handle very long text content', () => {
      const longText = 'A'.repeat(100);
      render(<CardTitle>{longText}</CardTitle>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle special characters in title', () => {
      render(<CardTitle>Title &lt;test&gt;</CardTitle>);
      expect(screen.getByText(/Title/)).toBeTruthy();
    });

    test('should handle emoji in content', () => {
      render(<CardTitle>✅ Success</CardTitle>);
      expect(screen.getByText('✅ Success')).toBeTruthy();
    });

    test('should handle unicode characters', () => {
      render(<CardTitle>日本語</CardTitle>);
      expect(screen.getByText('日本語')).toBeTruthy();
    });

    test('should handle nested elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>
              <span>Nested</span>
            </CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Nested')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label on Card', () => {
      const { container } = render(
        <Card aria-label="Profile card">Content</Card>
      );
      expect(container.querySelector('[aria-label="Profile card"]')).toBeTruthy();
    });

    test('should support aria-describedby on Card', () => {
      const { container } = render(
        <Card aria-describedby="card-desc">Content</Card>
      );
      expect(container.querySelector('[aria-describedby="card-desc"]')).toBeTruthy();
    });

    test('CardTitle should be semantic h3', () => {
      const { container } = render(
        <Card>
          <CardTitle>Main Heading</CardTitle>
        </Card>
      );
      const h3 = container.querySelector('h3');
      expect(h3?.tagName).toBe('H3');
      expect(screen.getByText('Main Heading')).toBeTruthy();
    });

    test('CardDescription should be semantic p tag', () => {
      const { container } = render(
        <Card>
          <CardDescription>Descriptive text</CardDescription>
        </Card>
      );
      const p = container.querySelector('p');
      expect(p?.tagName).toBe('P');
      expect(screen.getByText('Descriptive text')).toBeTruthy();
    });

    test('should support role attribute on any component', () => {
      const { container } = render(
        <Card role="region">Content</Card>
      );
      expect(container.querySelector('[role="region"]')).toBeTruthy();
    });

    test('should support aria-hidden for decorative content', () => {
      const { container } = render(
        <Card aria-hidden="true">Decorative</Card>
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });
  });

  describe('Styling Integration', () => {
    test('should support dark mode classes on Card', () => {
      const { container } = render(
        <Card className="dark:bg-slate-900 dark:border-slate-700">Dark</Card>
      );
      const card = container.querySelector('div');
      expect(card?.className).toContain('dark:bg-slate-900');
      expect(card?.className).toContain('dark:border-slate-700');
    });

    test('should support responsive classes on Card', () => {
      const { container } = render(
        <Card className="sm:p-4 md:p-6 lg:p-8">Responsive</Card>
      );
      const card = container.querySelector('div');
      expect(card?.className).toContain('sm:p-4');
      expect(card?.className).toContain('md:p-6');
      expect(card?.className).toContain('lg:p-8');
    });

    test('should support hover states', () => {
      const { container } = render(
        <Card className="hover:shadow-lg hover:scale-105">Hover</Card>
      );
      const card = container.querySelector('div');
      expect(card?.className).toContain('hover:shadow-lg');
    });

    test('should support custom spacing on CardHeader', () => {
      const { container } = render(
        <CardHeader className="p-4">Header</CardHeader>
      );
      const header = container.querySelector('div');
      expect(header?.className).toContain('p-4');
      expect(header?.className).toContain('flex');
    });

    test('should support custom text sizes on CardTitle', () => {
      const { container } = render(
        <CardTitle className="text-3xl">Large Title</CardTitle>
      );
      const title = container.querySelector('h3');
      expect(title?.className).toContain('text-3xl');
      expect(title?.className).toContain('font-semibold');
    });
  });

  describe('Type Safety', () => {
    test('should accept HTMLAttributes on Card', () => {
      const { container } = render(
        <Card 
          id="card-1"
          className="custom"
          data-testid="test"
        >
          Content
        </Card>
      );
      expect(container.querySelector('#card-1')).toBeTruthy();
      expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
    });

    test('should work with React.forwardRef patterns', () => {
      const CustomCard = React.forwardRef<HTMLDivElement, any>((props, ref) => (
        <Card ref={ref} {...props} />
      ));
      
      const ref = React.createRef<HTMLDivElement>();
      render(
        <CustomCard ref={ref}>Forward Ref</CustomCard>
      );
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should accept React.HTMLAttributes on CardTitle', () => {
      const { container } = render(
        <CardTitle 
          id="title-1"
          className="custom"
          aria-label="Section title"
        >
          Title
        </CardTitle>
      );
      expect(container.querySelector('#title-1')).toBeTruthy();
      expect(container.querySelector('[aria-label="Section title"]')).toBeTruthy();
    });
  });

  describe('Common Usage Patterns', () => {
    test('should work as info card with title and description', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
            <CardDescription>This is some information</CardDescription>
          </CardHeader>
          <CardContent>
            Detailed content goes here
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Information')).toBeTruthy();
      expect(screen.getByText('This is some information')).toBeTruthy();
      expect(screen.getByText('Detailed content goes here')).toBeTruthy();
    });

    test('should work as form card with buttons', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Form</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="text" placeholder="Name" />
          </CardContent>
          <CardFooter>
            <button>Submit</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Form')).toBeTruthy();
      expect(screen.getByPlaceholderText('Name')).toBeTruthy();
      expect(screen.getByText('Submit')).toBeTruthy();
    });

    test('should work as layout container with sections', () => {
      render(
        <Card>
          <CardHeader>Header Section</CardHeader>
          <CardContent>Main Content</CardContent>
          <CardContent>Additional Content</CardContent>
          <CardFooter>Footer Section</CardFooter>
        </Card>
      );

      expect(screen.getByText('Header Section')).toBeTruthy();
      expect(screen.getByText('Main Content')).toBeTruthy();
      expect(screen.getByText('Footer Section')).toBeTruthy();
    });

    test('should work with icon and title layout', () => {
      render(
        <Card>
          <CardHeader>
            <div>
              <span>🎯</span>
              <CardTitle>Goal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>Achieve this goal</CardContent>
        </Card>
      );

      expect(screen.getByText('Goal')).toBeTruthy();
      expect(screen.getByText('🎯')).toBeTruthy();
    });
  });
});
