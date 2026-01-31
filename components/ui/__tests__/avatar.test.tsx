import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

// Mock Radix UI Avatar
jest.mock('@radix-ui/react-avatar', () => ({
  Root: React.forwardRef(({ className, ...props }: any, ref: any) => (
    <div ref={ref} className={className} data-testid="avatar-root" {...props} />
  )),
  Image: React.forwardRef(({ className, ...props }: any, ref: any) => (
    <img alt="" ref={ref} className={className} data-testid="avatar-image" {...props} />
  )),
  Fallback: React.forwardRef(({ className, ...props }: any, ref: any) => (
    <div ref={ref} className={className} data-testid="avatar-fallback" {...props} />
  )),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('Avatar Components', () => {
  describe('Avatar Root Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<Avatar />);
      expect(container).toBeTruthy();
    });

    test('should render with Avatar root element', () => {
      const { container } = render(<Avatar />);
      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
    });

    test('should apply default classes', () => {
      const { container } = render(<Avatar />);
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.className).toContain('relative');
      expect(avatar?.className).toContain('flex');
      expect(avatar?.className).toContain('h-10');
      expect(avatar?.className).toContain('w-10');
    });

    test('should accept and merge custom className', () => {
      const { container } = render(<Avatar className="custom-class" />);
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.className).toContain('custom-class');
      expect(avatar?.className).toContain('relative');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Avatar ref={ref} />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.dataset.testid).toBe('avatar-root');
    });

    test('should pass through additional props', () => {
      const { container } = render(
        <Avatar aria-label="User avatar" role="img" />
      );
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.getAttribute('aria-label')).toBe('User avatar');
      expect(avatar?.getAttribute('role')).toBe('img');
    });

    test('should handle multiple custom classes', () => {
      const { container } = render(
        <Avatar className="class1 class2 class3" />
      );
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.className).toContain('class1');
      expect(avatar?.className).toContain('class2');
      expect(avatar?.className).toContain('class3');
    });
  });

  describe('AvatarImage Component', () => {
    test('should render without crashing', () => {
      const { container } = render(<AvatarImage src="/test.jpg" />);
      expect(container).toBeTruthy();
    });

    test('should render image element with correct src', () => {
      render(<AvatarImage src="/avatar.jpg" alt="User avatar" />);
      const image = screen.getByTestId('avatar-image');
      expect(image).toBeTruthy();
      expect((image as HTMLImageElement).src).toContain('/avatar.jpg');
    });

    test('should apply default image classes', () => {
      const { container } = render(<AvatarImage src="/test.jpg" />);
      const image = container.querySelector('[data-testid="avatar-image"]');
      expect(image?.className).toContain('aspect-square');
      expect(image?.className).toContain('h-full');
      expect(image?.className).toContain('w-full');
    });

    test('should accept and merge custom className', () => {
      const { container } = render(
        <AvatarImage src="/test.jpg" className="custom-image" />
      );
      const image = container.querySelector('[data-testid="avatar-image"]');
      expect(image?.className).toContain('custom-image');
      expect(image?.className).toContain('aspect-square');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLImageElement>();
      render(<AvatarImage ref={ref} src="/test.jpg" />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('IMG');
    });

    test('should pass through alt text', () => {
      const { container } = render(
        <AvatarImage src="/test.jpg" alt="Profile picture" />
      );
      const image = container.querySelector('[data-testid="avatar-image"]');
      expect(image?.getAttribute('alt')).toBe('Profile picture');
    });

    test('should support data attributes', () => {
      const { container } = render(
        <AvatarImage src="/test.jpg" data-testid="custom-test-id" />
      );
      expect(container.querySelector('[data-testid="custom-test-id"]')).toBeTruthy();
    });
  });

  describe('AvatarFallback Component', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <AvatarFallback>JD</AvatarFallback>
      );
      expect(container).toBeTruthy();
    });

    test('should render fallback element with text', () => {
      render(<AvatarFallback>AB</AvatarFallback>);
      expect(screen.getByText('AB')).toBeTruthy();
    });

    test('should apply default fallback classes', () => {
      const { container } = render(<AvatarFallback>JD</AvatarFallback>);
      const fallback = container.querySelector('[data-testid="avatar-fallback"]');
      expect(fallback?.className).toContain('flex');
      expect(fallback?.className).toContain('h-full');
      expect(fallback?.className).toContain('w-full');
      expect(fallback?.className).toContain('items-center');
      expect(fallback?.className).toContain('justify-center');
      expect(fallback?.className).toContain('rounded-full');
      expect(fallback?.className).toContain('bg-muted');
    });

    test('should accept and merge custom className', () => {
      const { container } = render(
        <AvatarFallback className="custom-fallback">JD</AvatarFallback>
      );
      const fallback = container.querySelector('[data-testid="avatar-fallback"]');
      expect(fallback?.className).toContain('custom-fallback');
      expect(fallback?.className).toContain('flex');
    });

    test('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<AvatarFallback ref={ref}>JD</AvatarFallback>);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.dataset.testid).toBe('avatar-fallback');
    });

    test('should support children as numbers', () => {
      render(<AvatarFallback>42</AvatarFallback>);
      expect(screen.getByText('42')).toBeTruthy();
    });

    test('should support children as complex elements', () => {
      render(
        <AvatarFallback>
          <span>Custom</span>
        </AvatarFallback>
      );
      expect(screen.getByText('Custom')).toBeTruthy();
    });

    test('should support aria attributes', () => {
      const { container } = render(
        <AvatarFallback aria-label="User initials">JD</AvatarFallback>
      );
      const fallback = container.querySelector('[data-testid="avatar-fallback"]');
      expect(fallback?.getAttribute('aria-label')).toBe('User initials');
    });
  });

  describe('Avatar Composition', () => {
    test('should work together as Avatar with Image and Fallback', () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/user.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="avatar-image"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="avatar-fallback"]')).toBeTruthy();
    });

    test('should render only Image in Avatar', () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/user.jpg" alt="User" />
        </Avatar>
      );

      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="avatar-image"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="avatar-fallback"]')).toBeFalsy();
    });

    test('should render only Fallback in Avatar', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="avatar-image"]')).toBeFalsy();
      expect(container.querySelector('[data-testid="avatar-fallback"]')).toBeTruthy();
    });

    test('should support custom styling in composition', () => {
      const { container } = render(
        <Avatar className="h-20 w-20">
          <AvatarImage src="/user.jpg" alt="User" className="object-cover" />
          <AvatarFallback className="bg-blue-500">AB</AvatarFallback>
        </Avatar>
      );

      const root = container.querySelector('[data-testid="avatar-root"]');
      expect(root?.className).toContain('h-20');
      expect(root?.className).toContain('w-20');

      const image = container.querySelector('[data-testid="avatar-image"]');
      expect(image?.className).toContain('object-cover');

      const fallback = container.querySelector('[data-testid="avatar-fallback"]');
      expect(fallback?.className).toContain('bg-blue-500');
    });

    test('should render multiple avatars independently', () => {
      const { container } = render(
        <>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </>
      );

      const roots = container.querySelectorAll('[data-testid="avatar-root"]');
      expect(roots.length).toBe(2);

      const fallbacks = container.querySelectorAll('[data-testid="avatar-fallback"]');
      expect(fallbacks.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty AvatarFallback', () => {
      const { container } = render(<AvatarFallback></AvatarFallback>);
      expect(container.querySelector('[data-testid="avatar-fallback"]')).toBeTruthy();
    });

    test('should handle Avatar without children', () => {
      const { container } = render(<Avatar />);
      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
    });

    test('should handle null className', () => {
      const { container } = render(<Avatar className={null as any} />);
      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
    });

    test('should handle undefined className', () => {
      const { container } = render(<Avatar className={undefined} />);
      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
    });

    test('should support empty string className', () => {
      const { container } = render(<Avatar className="" />);
      expect(container.querySelector('[data-testid="avatar-root"]')).toBeTruthy();
    });

    test('should handle very long src URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      const { container } = render(<AvatarImage src={longUrl} />);
      const image = container.querySelector('[data-testid="avatar-image"]');
      expect((image as HTMLImageElement).src).toContain('example.com');
    });

    test('should handle special characters in alt text', () => {
      const { container } = render(
        <AvatarImage src="/test.jpg" alt='User & "Admin" <avatar>' />
      );
      const image = container.querySelector('[data-testid="avatar-image"]');
      expect(image?.getAttribute('alt')).toContain('User');
    });

    test('should handle emoji in fallback', () => {
      render(<AvatarFallback>👤</AvatarFallback>);
      expect(screen.getByText('👤')).toBeTruthy();
    });

    test('should handle unicode characters in fallback', () => {
      render(<AvatarFallback>日本</AvatarFallback>);
      expect(screen.getByText('日本')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should support role attribute', () => {
      const { container } = render(<Avatar role="img" />);
      expect(container.querySelector('[role="img"]')).toBeTruthy();
    });

    test('should support aria-label', () => {
      const { container } = render(<Avatar aria-label="User avatar" />);
      expect(container.querySelector('[aria-label="User avatar"]')).toBeTruthy();
    });

    test('should support aria-describedby', () => {
      const { container } = render(
        <Avatar aria-describedby="avatar-desc" />
      );
      expect(container.querySelector('[aria-describedby="avatar-desc"]')).toBeTruthy();
    });

    test('should support aria-hidden on decorative avatars', () => {
      const { container } = render(
        <Avatar aria-hidden="true">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });

    test('AvatarImage should support alt text for accessibility', () => {
      render(<AvatarImage src="/user.jpg" alt="Jane Doe" />);
      const image = screen.getByAltText('Jane Doe');
      expect(image).toBeTruthy();
    });
  });

  describe('Styling Integration', () => {
    test('should preserve Tailwind classes from default styling', () => {
      const { container } = render(<Avatar />);
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      const classes = avatar?.className?.split(' ') || [];
      
      expect(classes).toContain('relative');
      expect(classes).toContain('flex');
      expect(classes).toContain('overflow-hidden');
      expect(classes).toContain('rounded-full');
    });

    test('should allow overriding size classes', () => {
      const { container } = render(<Avatar className="h-20 w-20" />);
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.className).toContain('h-20');
      expect(avatar?.className).toContain('w-20');
    });

    test('should support dark mode classes', () => {
      const { container } = render(
        <Avatar className="dark:border-gray-800" />
      );
      const avatar = container.querySelector('[data-testid="avatar-root"]');
      expect(avatar?.className).toContain('dark:border-gray-800');
    });
  });
});
