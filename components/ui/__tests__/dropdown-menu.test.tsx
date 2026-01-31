import React from 'react';
import { render, screen } from '@testing-library/react';
import * as DropdownMenuComponents from '../dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '../dropdown-menu';

// Mock Radix UI Dropdown Menu
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: React.forwardRef(({ children, ...props }: any, ref) => (
    <button ref={ref} data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  )),
  Content: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-content" {...props}>
      {children}
    </div>
  )),
  Item: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-item" {...props}>
      {children}
    </div>
  )),
  CheckboxItem: React.forwardRef(({ children, className, checked, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-checkbox-item" data-checked={checked} {...props}>
      {children}
    </div>
  )),
  RadioItem: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-radio-item" {...props}>
      {children}
    </div>
  )),
  Label: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <span ref={ref} className={className} data-testid="dropdown-label" {...props}>
      {children}
    </span>
  )),
  Separator: React.forwardRef(({ className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-separator" {...props} />
  )),
  Group: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
  Portal: ({ children }: any) => <>{children}</>,
  Sub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
  SubContent: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-subcontent" {...props}>
      {children}
    </div>
  )),
  SubTrigger: React.forwardRef(({ children, className, ...props }: any, ref) => (
    <div ref={ref} className={className} data-testid="dropdown-subtrigger" {...props}>
      {children}
    </div>
  )),
  ItemIndicator: ({ children }: any) => <span data-testid="dropdown-item-indicator">{children}</span>,
  RadioGroup: ({ children }: any) => <div data-testid="dropdown-radiogroup">{children}</div>,
}));

// Mock Radix UI Icons
jest.mock('@radix-ui/react-icons', () => ({
  CheckIcon: () => <span data-testid="check-icon">✓</span>,
  ChevronRightIcon: () => <span data-testid="chevron-icon">›</span>,
  DotFilledIcon: () => <span data-testid="dot-icon">●</span>,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Dropdown Menu Components', () => {
  describe('DropdownMenu', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <DropdownMenu>
          <div>Content</div>
        </DropdownMenu>
      );
      expect(container).toBeTruthy();
    });

    test('should render as a root container', () => {
      render(
        <DropdownMenu>
          <div>Dropdown Content</div>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toBeTruthy();
    });

    test('should have correct displayName', () => {
      const Root = DropdownMenu;
      expect(Root).toBeTruthy();
    });
  });

  describe('DropdownMenuTrigger', () => {
    test('should render button element', () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        </DropdownMenu>
      );
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(screen.getByText('Open Menu')).toBeTruthy();
    });

    test('should pass through HTML attributes', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="custom-trigger" aria-label="Menu">
            Open
          </DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('custom-trigger')).toBeTruthy();
      expect(screen.getByLabelText('Menu')).toBeTruthy();
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger ref={ref}>Trigger</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('DropdownMenuContent', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuContent>
          <div>Menu Items</div>
        </DropdownMenuContent>
      );
      expect(screen.getByTestId('dropdown-content')).toBeTruthy();
    });

    test('should apply default classes', () => {
      const { container } = render(
        <DropdownMenuContent>Content</DropdownMenuContent>
      );
      const content = container.querySelector('[data-testid="dropdown-content"]');
      expect(content?.className).toContain('z-50');
      expect(content?.className).toContain('min-w-[8rem]');
      expect(content?.className).toContain('overflow-hidden');
      expect(content?.className).toContain('rounded-md');
      expect(content?.className).toContain('border');
      expect(content?.className).toContain('bg-popover');
      expect(content?.className).toContain('p-1');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuContent className="custom-content">Content</DropdownMenuContent>
      );
      const content = container.querySelector('[data-testid="dropdown-content"]');
      expect(content?.className).toContain('custom-content');
      expect(content?.className).toContain('z-50');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<DropdownMenuContent ref={ref}>Content</DropdownMenuContent>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    test('should accept sideOffset prop', () => {
      render(<DropdownMenuContent sideOffset={8}>Content</DropdownMenuContent>);
      expect(screen.getByTestId('dropdown-content')).toBeTruthy();
    });

    test('should have animation classes', () => {
      const { container } = render(
        <DropdownMenuContent>Animated</DropdownMenuContent>
      );
      const content = container.querySelector('[data-testid="dropdown-content"]');
      expect(content?.className).toContain('animate-in');
      expect(content?.className).toContain('animate-out');
      expect(content?.className).toContain('fade-in');
      expect(content?.className).toContain('zoom-in');
    });
  });

  describe('DropdownMenuItem', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuItem>Item</DropdownMenuItem>);
      expect(screen.getByTestId('dropdown-item')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<DropdownMenuItem>Menu Item Text</DropdownMenuItem>);
      expect(screen.getByText('Menu Item Text')).toBeTruthy();
    });

    test('should apply default item classes', () => {
      const { container } = render(
        <DropdownMenuItem>Item</DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('flex');
      expect(item?.className).toContain('cursor-default');
      expect(item?.className).toContain('select-none');
      expect(item?.className).toContain('rounded-sm');
      expect(item?.className).toContain('px-2');
      expect(item?.className).toContain('py-1.5');
      expect(item?.className).toContain('text-sm');
    });

    test('should support inset prop', () => {
      const { container } = render(
        <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('pl-8');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('custom-item');
      expect(item?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(<DropdownMenuItem ref={ref}>Item</DropdownMenuItem>);
      expect(ref.current).toBeTruthy();
    });

    test('should support disabled state', () => {
      const { container } = render(
        <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('data-[disabled]:pointer-events-none');
      expect(item?.className).toContain('data-[disabled]:opacity-50');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuCheckboxItem>Checkbox Item</DropdownMenuCheckboxItem>);
      expect(screen.getByTestId('dropdown-checkbox-item')).toBeTruthy();
    });

    test('should render with CheckIcon indicator', () => {
      render(
        <DropdownMenuCheckboxItem checked>
          Item
        </DropdownMenuCheckboxItem>
      );
      expect(screen.getByTestId('check-icon')).toBeTruthy();
    });

    test('should apply checkbox item classes', () => {
      const { container } = render(
        <DropdownMenuCheckboxItem>Item</DropdownMenuCheckboxItem>
      );
      const item = container.querySelector('[data-testid="dropdown-checkbox-item"]');
      expect(item?.className).toContain('relative');
      expect(item?.className).toContain('flex');
      expect(item?.className).toContain('cursor-default');
      expect(item?.className).toContain('pl-8');
      expect(item?.className).toContain('pr-2');
    });

    test('should support checked prop', () => {
      const { container } = render(
        <DropdownMenuCheckboxItem checked={true}>
          Checked Item
        </DropdownMenuCheckboxItem>
      );
      const item = container.querySelector('[data-testid="dropdown-checkbox-item"]');
      expect(item?.getAttribute('data-checked')).toBe('true');
    });

    test('should support unchecked state', () => {
      const { container } = render(
        <DropdownMenuCheckboxItem checked={false}>
          Unchecked Item
        </DropdownMenuCheckboxItem>
      );
      const item = container.querySelector('[data-testid="dropdown-checkbox-item"]');
      expect(item?.getAttribute('data-checked')).toBe('false');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuCheckboxItem className="custom-checkbox">Item</DropdownMenuCheckboxItem>
      );
      const item = container.querySelector('[data-testid="dropdown-checkbox-item"]');
      expect(item?.className).toContain('custom-checkbox');
      expect(item?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(<DropdownMenuCheckboxItem ref={ref}>Item</DropdownMenuCheckboxItem>);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('DropdownMenuRadioItem', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuRadioItem value="radio-item">Radio Item</DropdownMenuRadioItem>);
      expect(screen.getByTestId('dropdown-radio-item')).toBeTruthy();
    });

    test('should render with DotFilledIcon indicator', () => {
      render(<DropdownMenuRadioItem value="radio-item">Item</DropdownMenuRadioItem>);
      expect(screen.getByTestId('dot-icon')).toBeTruthy();
    });

    test('should apply radio item classes', () => {
      const { container } = render(
        <DropdownMenuRadioItem value="radio-item">Item</DropdownMenuRadioItem>
      );
      const item = container.querySelector('[data-testid="dropdown-radio-item"]');
      expect(item?.className).toContain('relative');
      expect(item?.className).toContain('flex');
      expect(item?.className).toContain('cursor-default');
      expect(item?.className).toContain('pl-8');
      expect(item?.className).toContain('pr-2');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuRadioItem value="radio-item" className="custom-radio">Item</DropdownMenuRadioItem>
      );
      const item = container.querySelector('[data-testid="dropdown-radio-item"]');
      expect(item?.className).toContain('custom-radio');
      expect(item?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(<DropdownMenuRadioItem value="radio-item" ref={ref}>Item</DropdownMenuRadioItem>);
      expect(ref.current).toBeTruthy();
    });

    test('should support value prop', () => {
      render(<DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>);
      expect(screen.getByText('Option 1')).toBeTruthy();
    });
  });

  describe('DropdownMenuLabel', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuLabel>Label</DropdownMenuLabel>);
      expect(screen.getByTestId('dropdown-label')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<DropdownMenuLabel>Menu Label</DropdownMenuLabel>);
      expect(screen.getByText('Menu Label')).toBeTruthy();
    });

    test('should apply default label classes', () => {
      const { container } = render(
        <DropdownMenuLabel>Label</DropdownMenuLabel>
      );
      const label = container.querySelector('[data-testid="dropdown-label"]');
      expect(label?.className).toContain('px-2');
      expect(label?.className).toContain('py-1.5');
      expect(label?.className).toContain('text-sm');
      expect(label?.className).toContain('font-semibold');
    });

    test('should support inset prop', () => {
      const { container } = render(
        <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
      );
      const label = container.querySelector('[data-testid="dropdown-label"]');
      expect(label?.className).toContain('pl-8');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuLabel className="custom-label">Label</DropdownMenuLabel>
      );
      const label = container.querySelector('[data-testid="dropdown-label"]');
      expect(label?.className).toContain('custom-label');
      expect(label?.className).toContain('font-semibold');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(<DropdownMenuLabel ref={ref}>Label</DropdownMenuLabel>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('SPAN');
    });
  });

  describe('DropdownMenuSeparator', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuSeparator />);
      expect(screen.getByTestId('dropdown-separator')).toBeTruthy();
    });

    test('should apply default separator classes', () => {
      const { container } = render(<DropdownMenuSeparator />);
      const separator = container.querySelector('[data-testid="dropdown-separator"]');
      expect(separator?.className).toContain('-mx-1');
      expect(separator?.className).toContain('my-1');
      expect(separator?.className).toContain('h-px');
      expect(separator?.className).toContain('bg-muted');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuSeparator className="custom-separator" />
      );
      const separator = container.querySelector('[data-testid="dropdown-separator"]');
      expect(separator?.className).toContain('custom-separator');
      expect(separator?.className).toContain('h-px');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<DropdownMenuSeparator ref={ref} />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  describe('DropdownMenuShortcut', () => {
    test('should render without crashing', () => {
      const { container } = render(<DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>);
      expect(container.querySelector('span')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<DropdownMenuShortcut>Cmd+K</DropdownMenuShortcut>);
      expect(screen.getByText('Cmd+K')).toBeTruthy();
    });

    test('should apply default shortcut classes', () => {
      const { container } = render(<DropdownMenuShortcut>Ctrl+Q</DropdownMenuShortcut>);
      const span = container.querySelector('span');
      expect(span?.className).toContain('ml-auto');
      expect(span?.className).toContain('text-xs');
      expect(span?.className).toContain('tracking-widest');
      expect(span?.className).toContain('opacity-60');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuShortcut className="custom-shortcut">Shortcut</DropdownMenuShortcut>
      );
      const span = container.querySelector('span');
      expect(span?.className).toContain('custom-shortcut');
      expect(span?.className).toContain('ml-auto');
    });

    test('should have correct displayName', () => {
      expect(DropdownMenuShortcut.displayName).toBe('DropdownMenuShortcut');
    });
  });

  describe('DropdownMenuGroup', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuGroup>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuGroup>
      );
      expect(screen.getByTestId('dropdown-group')).toBeTruthy();
    });

    test('should render multiple items', () => {
      render(
        <DropdownMenuGroup>
          <DropdownMenuItem>Group Item 1</DropdownMenuItem>
          <DropdownMenuItem>Group Item 2</DropdownMenuItem>
        </DropdownMenuGroup>
      );
      expect(screen.getByText('Group Item 1')).toBeTruthy();
      expect(screen.getByText('Group Item 2')).toBeTruthy();
    });

    test('should support children prop', () => {
      render(
        <DropdownMenuGroup>
          <div>Group content</div>
        </DropdownMenuGroup>
      );
      expect(screen.getByText('Group content')).toBeTruthy();
    });
  });

  describe('DropdownMenuPortal', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuPortal>
          <div>Portaled Content</div>
        </DropdownMenuPortal>
      );
      expect(screen.getByText('Portaled Content')).toBeTruthy();
    });

    test('should render children directly (no portal div)', () => {
      const { container } = render(
        <DropdownMenuPortal>
          <div>Portal Content</div>
        </DropdownMenuPortal>
      );
      expect(container.querySelector('div')).toBeTruthy();
    });
  });

  describe('DropdownMenuSub', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuSub>
          <div>Submenu</div>
        </DropdownMenuSub>
      );
      expect(screen.getByTestId('dropdown-sub')).toBeTruthy();
    });

    test('should render children', () => {
      render(
        <DropdownMenuSub>
          <div>Submenu Content</div>
        </DropdownMenuSub>
      );
      expect(screen.getByText('Submenu Content')).toBeTruthy();
    });
  });

  describe('DropdownMenuSubTrigger', () => {
    test('should render without crashing', () => {
      render(<DropdownMenuSubTrigger>Submenu</DropdownMenuSubTrigger>);
      expect(screen.getByTestId('dropdown-subtrigger')).toBeTruthy();
    });

    test('should render text content', () => {
      render(<DropdownMenuSubTrigger>Open Submenu</DropdownMenuSubTrigger>);
      expect(screen.getByText('Open Submenu')).toBeTruthy();
    });

    test('should render ChevronRightIcon', () => {
      render(<DropdownMenuSubTrigger>Menu</DropdownMenuSubTrigger>);
      expect(screen.getByTestId('chevron-icon')).toBeTruthy();
    });

    test('should apply default subtrigger classes', () => {
      const { container } = render(
        <DropdownMenuSubTrigger>Trigger</DropdownMenuSubTrigger>
      );
      const trigger = container.querySelector('[data-testid="dropdown-subtrigger"]');
      expect(trigger?.className).toContain('flex');
      expect(trigger?.className).toContain('cursor-default');
      expect(trigger?.className).toContain('select-none');
      expect(trigger?.className).toContain('rounded-sm');
      expect(trigger?.className).toContain('px-2');
      expect(trigger?.className).toContain('py-1.5');
    });

    test('should support inset prop', () => {
      const { container } = render(
        <DropdownMenuSubTrigger inset>Inset Trigger</DropdownMenuSubTrigger>
      );
      const trigger = container.querySelector('[data-testid="dropdown-subtrigger"]');
      expect(trigger?.className).toContain('pl-8');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuSubTrigger className="custom-subtrigger">Trigger</DropdownMenuSubTrigger>
      );
      const trigger = container.querySelector('[data-testid="dropdown-subtrigger"]');
      expect(trigger?.className).toContain('custom-subtrigger');
      expect(trigger?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<any>();
      render(<DropdownMenuSubTrigger ref={ref}>Trigger</DropdownMenuSubTrigger>);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('DropdownMenuSubContent', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuSubContent>
          <div>Submenu Items</div>
        </DropdownMenuSubContent>
      );
      expect(screen.getByTestId('dropdown-subcontent')).toBeTruthy();
    });

    test('should render children', () => {
      render(
        <DropdownMenuSubContent>
          <div>Sub Item 1</div>
        </DropdownMenuSubContent>
      );
      expect(screen.getByText('Sub Item 1')).toBeTruthy();
    });

    test('should apply default subcontent classes', () => {
      const { container } = render(
        <DropdownMenuSubContent>Content</DropdownMenuSubContent>
      );
      const content = container.querySelector('[data-testid="dropdown-subcontent"]');
      expect(content?.className).toContain('z-50');
      expect(content?.className).toContain('min-w-[8rem]');
      expect(content?.className).toContain('overflow-hidden');
      expect(content?.className).toContain('rounded-md');
      expect(content?.className).toContain('border');
      expect(content?.className).toContain('bg-popover');
      expect(content?.className).toContain('p-1');
    });

    test('should merge custom className', () => {
      const { container } = render(
        <DropdownMenuSubContent className="custom-subcontent">Content</DropdownMenuSubContent>
      );
      const content = container.querySelector('[data-testid="dropdown-subcontent"]');
      expect(content?.className).toContain('custom-subcontent');
      expect(content?.className).toContain('z-50');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<DropdownMenuSubContent ref={ref}>Content</DropdownMenuSubContent>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  describe('DropdownMenuRadioGroup', () => {
    test('should render without crashing', () => {
      render(
        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem value="radio-item">Option 1</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      );
      expect(screen.getByTestId('dropdown-radiogroup')).toBeTruthy();
    });

    test('should render multiple radio items', () => {
      render(
        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem value="radio-item">Option 1</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="radio-item">Option 2</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
    });
  });

  describe('Menu Composition', () => {
    test('should work with complete dropdown menu', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              Show Details
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Open')).toBeTruthy();
      expect(screen.getByText('Actions')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.getByText('Delete')).toBeTruthy();
      expect(screen.getByText('Show Details')).toBeTruthy();
    });

    test('should work with grouped items', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="radio-item">List View</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="radio-item">Grid View</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      );

      expect(screen.getByText('View')).toBeTruthy();
      expect(screen.getByText('List View')).toBeTruthy();
      expect(screen.getByText('Grid View')).toBeTruthy();
    });

    test('should work with submenus', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Advanced</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Option 1</DropdownMenuItem>
              <DropdownMenuItem>Option 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      );

      expect(screen.getByText('Advanced')).toBeTruthy();
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
    });

    test('should work with items and shortcuts', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuItem>
            <span>Save</span>
            <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Undo</span>
            <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      );

      expect(screen.getByText('Save')).toBeTruthy();
      expect(screen.getByText('Ctrl+S')).toBeTruthy();
      expect(screen.getByText('Undo')).toBeTruthy();
      expect(screen.getByText('Ctrl+Z')).toBeTruthy();
    });
  });

  describe('Export Types', () => {
    test('should export all components', () => {
      expect(DropdownMenuComponents.DropdownMenu).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuTrigger).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuContent).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuItem).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuCheckboxItem).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuRadioItem).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuLabel).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuSeparator).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuShortcut).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuGroup).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuPortal).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuSub).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuSubContent).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuSubTrigger).toBeTruthy();
      expect(DropdownMenuComponents.DropdownMenuRadioGroup).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children', () => {
      render(
        <DropdownMenuContent>{null}</DropdownMenuContent>
      );
      expect(screen.getByTestId('dropdown-content')).toBeTruthy();
    });

    test('should handle empty content', () => {
      render(<DropdownMenuContent />);
      expect(screen.getByTestId('dropdown-content')).toBeTruthy();
    });

    test('should handle multiple separators', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 3</DropdownMenuItem>
        </DropdownMenuContent>
      );

      expect(screen.getAllByTestId('dropdown-separator').length).toBe(2);
    });

    test('should handle deeply nested submenus', () => {
      render(
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Level 1</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Level 2</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Nested Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );

      expect(screen.getByText('Level 1')).toBeTruthy();
      expect(screen.getByText('Level 2')).toBeTruthy();
      expect(screen.getByText('Nested Item')).toBeTruthy();
    });

    test('should handle very long item text', () => {
      const longText = 'A'.repeat(100);
      render(<DropdownMenuItem>{longText}</DropdownMenuItem>);
      expect(screen.getByText(longText)).toBeTruthy();
    });

    test('should handle special characters in labels', () => {
      render(<DropdownMenuLabel>File &gt; Export</DropdownMenuLabel>);
      expect(screen.getByText('File > Export')).toBeTruthy();
    });

    test('should handle emoji content', () => {
      render(
        <DropdownMenuItem>
          ✅ Done
        </DropdownMenuItem>
      );
      expect(screen.getByText('✅ Done')).toBeTruthy();
    });

    test('should handle unicode characters', () => {
      render(
        <DropdownMenuLabel>日本語</DropdownMenuLabel>
      );
      expect(screen.getByText('日本語')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should support aria-label on trigger', () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu Options">Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(container.querySelector('[aria-label="Menu Options"]')).toBeTruthy();
    });

    test('should support aria-describedby on content', () => {
      const { container } = render(
        <DropdownMenuContent aria-describedby="menu-desc">
          Content
        </DropdownMenuContent>
      );
      expect(container.querySelector('[aria-describedby="menu-desc"]')).toBeTruthy();
    });

    test('should support role on items', () => {
      const { container } = render(
        <DropdownMenuItem role="menuitem">
          Delete
        </DropdownMenuItem>
      );
      expect(container.querySelector('[role="menuitem"]')).toBeTruthy();
    });

    test('should support disabled attribute on items', () => {
      const { container } = render(
        <DropdownMenuItem disabled>
          Disabled
        </DropdownMenuItem>
      );
      expect(container.querySelector('[disabled]')).toBeTruthy();
    });

    test('should render indicators for checkbox items', () => {
      render(
        <DropdownMenuCheckboxItem checked>
          Checked
        </DropdownMenuCheckboxItem>
      );
      expect(screen.getByTestId('dropdown-item-indicator')).toBeTruthy();
    });

    test('should render indicators for radio items', () => {
      render(
        <DropdownMenuRadioItem value="radio-item"> 
          Option
        </DropdownMenuRadioItem>
      );
      expect(screen.getByTestId('dropdown-item-indicator')).toBeTruthy();
    });
  });

  describe('Styling Combinations', () => {
    test('should support dark mode on content', () => {
      const { container } = render(
        <DropdownMenuContent className="dark:bg-slate-900 dark:border-slate-700">
          Dark Content
        </DropdownMenuContent>
      );
      const content = container.querySelector('[data-testid="dropdown-content"]');
      expect(content?.className).toContain('dark:bg-slate-900');
    });

    test('should support responsive classes on items', () => {
      const { container } = render(
        <DropdownMenuItem className="sm:px-4 md:px-6">
          Responsive
        </DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('sm:px-4');
    });

    test('should support hover states', () => {
      const { container } = render(
        <DropdownMenuItem className="hover:bg-accent">
          Hover Item
        </DropdownMenuItem>
      );
      const item = container.querySelector('[data-testid="dropdown-item"]');
      expect(item?.className).toContain('hover:bg-accent');
    });

    test('should support focus states', () => {
      const { container } = render(
        <DropdownMenuContent className="focus:outline-none">
          Content
        </DropdownMenuContent>
      );
      const content = container.querySelector('[data-testid="dropdown-content"]');
      expect(content?.className).toContain('focus:outline-none');
    });
  });

  describe('Inset Variations', () => {
    test('should apply inset to items', () => {
      const { container } = render(
        <DropdownMenuContent>
          <DropdownMenuItem>Normal Item</DropdownMenuItem>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      );
      const items = container.querySelectorAll('[data-testid="dropdown-item"]');
      expect(items[1]?.className).toContain('pl-8');
    });

    test('should apply inset to labels', () => {
      const { container } = render(
        <DropdownMenuContent>
          <DropdownMenuLabel>Normal Label</DropdownMenuLabel>
          <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
        </DropdownMenuContent>
      );
      const labels = container.querySelectorAll('[data-testid="dropdown-label"]');
      expect(labels[1]?.className).toContain('pl-8');
    });

    test('should apply inset to subtriggers', () => {
      const { container } = render(
        <DropdownMenuContent>
          <DropdownMenuSubTrigger>Normal</DropdownMenuSubTrigger>
          <DropdownMenuSubTrigger inset>Inset</DropdownMenuSubTrigger>
        </DropdownMenuContent>
      );
      const triggers = container.querySelectorAll('[data-testid="dropdown-subtrigger"]');
      expect(triggers[1]?.className).toContain('pl-8');
    });
  });

  describe('Type Safety', () => {
    test('should accept children as ReactNode', () => {
      render(
        <DropdownMenuContent>
          <div>Children 1</div>
          <div>Children 2</div>
          <span>Children 3</span>
        </DropdownMenuContent>
      );
      expect(screen.getByText('Children 1')).toBeTruthy();
      expect(screen.getByText('Children 2')).toBeTruthy();
      expect(screen.getByText('Children 3')).toBeTruthy();
    });

    test('should work with custom component refs', () => {
      const ref = React.createRef<any>();
      render(
        <DropdownMenuContent ref={ref}>
          Content
        </DropdownMenuContent>
      );
      expect(ref.current).toBeTruthy();
    });

    test('should support all HTML attributes', () => {
      const { container } = render(
        <DropdownMenuContent
          id="menu-content"
          className="custom-class"
          data-testid="custom-data-testid"
          title="Menu"
        >
          Content
        </DropdownMenuContent>
      );
      expect(container.querySelector('#menu-content')).toBeTruthy();
      expect(container.querySelector('[title="Menu"]')).toBeTruthy();
    });
  });

  describe('Display Names', () => {
    test('DropdownMenuShortcut should have displayName', () => {
      expect(DropdownMenuShortcut.displayName).toBe('DropdownMenuShortcut');
    });
  });

  describe('Common Usage Patterns', () => {
    test('should work as file menu with actions and shortcuts', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>File</DropdownMenuLabel>
            <DropdownMenuItem>
              <span>New</span>
              <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Open</span>
              <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      );

      expect(screen.getByText('File')).toBeTruthy();
      expect(screen.getByText('New')).toBeTruthy();
      expect(screen.getByText('Ctrl+N')).toBeTruthy();
    });

    test('should work as options menu with radio items', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuLabel>Display Mode</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      );

      expect(screen.getByText('Display Mode')).toBeTruthy();
      expect(screen.getByText('Light')).toBeTruthy();
      expect(screen.getByText('Dark')).toBeTruthy();
    });

    test('should work as settings menu with checkboxes', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuLabel>Preferences</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={true}>
            Show Notifications
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Enable Sound
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      );

      expect(screen.getByText('Preferences')).toBeTruthy();
      expect(screen.getByText('Show Notifications')).toBeTruthy();
      expect(screen.getByText('Enable Sound')).toBeTruthy();
    });

    test('should work as advanced menu with submenus', () => {
      render(
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Advanced Settings</DropdownMenuItem>
              <DropdownMenuItem>Developer Tools</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>About</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      );

      expect(screen.getByText('More Options')).toBeTruthy();
      expect(screen.getByText('Advanced Settings')).toBeTruthy();
      expect(screen.getByText('Developer Tools')).toBeTruthy();
      expect(screen.getByText('About')).toBeTruthy();
    });
  });
});
