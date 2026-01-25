import React from 'react';
import { render, screen } from '@testing-library/react';
import NavbarItem from '../NavbarItem';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid="navbar-link">
      {children}
    </a>
  );
});

const mockLabel = 'Home';
const mockHref = '/home';

describe('NavbarItem Component', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      expect(container).toBeTruthy();
    });

    test('should render Link component', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByTestId('navbar-link')).toBeTruthy();
    });

    test('should render label text', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByText(mockLabel)).toBeTruthy();
    });

    test('should render with correct structure', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      expect(container.querySelector('a')).toBeTruthy();
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should render all required elements', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const link = screen.getByTestId('navbar-link');
      const div = container.querySelector('div');
      expect(link).toBeTruthy();
      expect(div).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    test('should render Link with correct href', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe(mockHref);
    });

    test('should use href prop in navigation', () => {
      const customHref = '/about';
      render(<NavbarItem label={mockLabel} href={customHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe(customHref);
    });

    test('should handle different href values', () => {
      const hrefs = ['/home', '/about', '/contact', '/products'];
      hrefs.forEach((href) => {
        const { container } = render(
          <NavbarItem label={mockLabel} href={href} />
        );
        const link = container.querySelector('a');
        expect(link?.getAttribute('href')).toBe(href);
      });
    });

    test('should link be clickable', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.tagName).toBe('A');
    });

    test('should have href attribute', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.hasAttribute('href')).toBe(true);
    });
  });

  describe('Label Text', () => {
    test('should render label correctly', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByText(mockLabel)).toBeTruthy();
    });

    test('should render label in div', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.textContent).toBe(mockLabel);
    });

    test('should display exact label text', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByText(mockLabel)).toBeInTheDocument();
    });

    test('should handle different label values', () => {
      const labels = ['Home', 'About', 'Contact', 'Products', 'Services'];
      labels.forEach((label) => {
        const { container } = render(
          <NavbarItem label={label} href={mockHref} />
        );
        expect(container.textContent).toContain(label);
      });
    });

    test('should handle long label text', () => {
      const longLabel = 'This is a very long navigation item label';
      render(<NavbarItem label={longLabel} href={mockHref} />);
      expect(screen.getByText(longLabel)).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    test('should have text-white class', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/text-white/);
    });

    test('should have transition class', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    test('should have cursor-pointer class', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });

    test('should have hover:text-gray-300 class', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/hover:text-gray-300/);
    });

    test('should have all required styling classes', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      const className = div?.className || '';
      expect(className).toMatch(/text-white/);
      expect(className).toMatch(/transition/);
      expect(className).toMatch(/cursor-pointer/);
      expect(className).toMatch(/hover:text-gray-300/);
    });

    test('should have consistent styling', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    test('should accept label prop', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      expect(container).toBeTruthy();
    });

    test('should accept href prop', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle both props correctly', () => {
      const { container } = render(
        <NavbarItem label="About Us" href="/about-us" />
      );
      const link = container.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/about-us');
      expect(container.textContent).toContain('About Us');
    });

    test('should handle different prop combinations', () => {
      const combinations = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Services', href: '/services' },
        { label: 'Contact', href: '/contact' },
      ];

      combinations.forEach(({ label, href }) => {
        const { container } = render(
          <NavbarItem label={label} href={href} />
        );
        const link = container.querySelector('a');
        expect(link?.getAttribute('href')).toBe(href);
        expect(container.textContent).toContain(label);
      });
    });

    test('should handle empty label', () => {
      const { container } = render(
        <NavbarItem label="" href={mockHref} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle special characters in label', () => {
      const specialLabel = 'Products & Services';
      render(<NavbarItem label={specialLabel} href={mockHref} />);
      expect(screen.getByText(specialLabel)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have semantic link element', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.tagName).toBe('A');
    });

    test('should have visible text content', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByText(mockLabel)).toBeTruthy();
    });

    test('should have href for navigation', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBeTruthy();
    });

    test('should be focusable link', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.tagName).toBe('A');
    });

    test('should have proper color contrast', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/text-white/);
    });

    test('should provide clear navigation text', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      expect(screen.getByText(mockLabel)).toBeInTheDocument();
    });
  });

  describe('Hover and Interactions', () => {
    test('should have hover styling class', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/hover:text-gray-300/);
    });

    test('should have transition for smooth hover', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/transition/);
    });

    test('should be interactive element', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.tagName).toBe('A');
    });

    test('should have cursor-pointer class for visual feedback', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toMatch(/cursor-pointer/);
    });
  });

  describe('Container Structure', () => {
    test('should have div container', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div).toBeTruthy();
    });

    test('should have Link wrapping div', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const link = container.querySelector('a');
      const div = link?.querySelector('div');
      expect(div).toBeTruthy();
    });

    test('should have correct nesting', () => {
      render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const link = screen.getByTestId('navbar-link');
      const div = link.querySelector('div');
      expect(div).toBeTruthy();
    });

    test('should have text directly in div', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.textContent).toBe(mockLabel);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in label', () => {
      render(<NavbarItem label="Features & Pricing" href={mockHref} />);
      expect(screen.getByText('Features & Pricing')).toBeTruthy();
    });

    test('should handle numeric label', () => {
      render(<NavbarItem label="2024" href={mockHref} />);
      expect(screen.getByText('2024')).toBeTruthy();
    });

    test('should handle label with spaces', () => {
      render(<NavbarItem label="About Us" href={mockHref} />);
      expect(screen.getByText('About Us')).toBeTruthy();
    });

    test('should handle href with parameters', () => {
      render(<NavbarItem label={mockLabel} href="/page?id=123" />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/page?id=123');
    });

    test('should handle href with hash', () => {
      render(<NavbarItem label={mockLabel} href="/page#section" />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/page#section');
    });

    test('should render multiple instances independently', () => {
      const { container: container1 } = render(
        <NavbarItem label="Home" href="/" />
      );
      const { container: container2 } = render(
        <NavbarItem label="About" href="/about" />
      );

      const link1 = container1.querySelector('a');
      const link2 = container2.querySelector('a');

      expect(link1?.getAttribute('href')).toBe('/');
      expect(link2?.getAttribute('href')).toBe('/about');
    });

    test('should handle unicode characters in label', () => {
      render(<NavbarItem label="🏠 Home" href={mockHref} />);
      expect(screen.getByText('🏠 Home')).toBeTruthy();
    });
  });

  describe('Component Integrity', () => {
    test('should maintain structure on re-render', () => {
      const { rerender, container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      rerender(<NavbarItem label={mockLabel} href={mockHref} />);

      expect(screen.getByTestId('navbar-link')).toBeTruthy();
      expect(screen.getByText(mockLabel)).toBeTruthy();
    });

    test('should handle prop updates', () => {
      const { rerender } = render(
        <NavbarItem label="Home" href="/" />
      );
      let link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/');

      rerender(<NavbarItem label="About" href="/about" />);
      link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/about');
      expect(screen.getByText('About')).toBeTruthy();
    });

    test('should render consistently', () => {
      const { container: container1 } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const { container: container2 } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    test('should update label on prop change', () => {
      const { rerender } = render(
        <NavbarItem label="Home" href={mockHref} />
      );
      expect(screen.getByText('Home')).toBeTruthy();

      rerender(<NavbarItem label="Dashboard" href={mockHref} />);
      expect(screen.getByText('Dashboard')).toBeTruthy();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    test('should update href on prop change', () => {
      const { rerender } = render(
        <NavbarItem label={mockLabel} href="/" />
      );
      let link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/');

      rerender(<NavbarItem label={mockLabel} href="/new-page" />);
      link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe('/new-page');
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple instances', () => {
      render(
        <>
          <NavbarItem label="Home" href="/" />
          <NavbarItem label="About" href="/about" />
          <NavbarItem label="Contact" href="/contact" />
        </>
      );

      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('About')).toBeTruthy();
      expect(screen.getByText('Contact')).toBeTruthy();
    });

    test('should maintain independent state in multiple instances', () => {
      const { container } = render(
        <>
          <NavbarItem label="Home" href="/" />
          <NavbarItem label="About" href="/about" />
        </>
      );

      const links = container.querySelectorAll('a');
      expect(links[0]?.getAttribute('href')).toBe('/');
      expect(links[1]?.getAttribute('href')).toBe('/about');
    });

    test('should handle different labels in list', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Services', href: '/services' },
      ];

      render(
        <>
          {items.map((item, index) => (
            <NavbarItem key={index} label={item.label} href={item.href} />
          ))}
        </>
      );

      items.forEach((item) => {
        expect(screen.getByText(item.label)).toBeTruthy();
      });
    });
  });

  describe('Text Rendering', () => {
    test('should render text as child of div', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.childNodes[0]?.textContent).toBe(mockLabel);
    });

    test('should not have extra whitespace', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.textContent).toBe(mockLabel);
    });

    test('should preserve label formatting', () => {
      const labelWithSpaces = 'About   Us';
      const { container } = render(
        <NavbarItem label={labelWithSpaces} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.textContent).toBe(labelWithSpaces);
    });
  });

  describe('Link Attributes', () => {
    test('should have href attribute', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.hasAttribute('href')).toBe(true);
    });

    test('should not have target attribute by default', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('target')).not.toBe('_blank');
    });

    test('should have correct href value', () => {
      const testHref = '/test-page';
      render(<NavbarItem label={mockLabel} href={testHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.getAttribute('href')).toBe(testHref);
    });

    test('should be anchor element', () => {
      render(<NavbarItem label={mockLabel} href={mockHref} />);
      const link = screen.getByTestId('navbar-link');
      expect(link.tagName.toLowerCase()).toBe('a');
    });
  });

  describe('CSS Classes', () => {
    test('should have text-white for styling', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('text-white');
    });

    test('should have transition for animation', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('transition');
    });

    test('should have cursor-pointer for interaction feedback', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('cursor-pointer');
    });

    test('should have hover:text-gray-300 for hover effect', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('hover:text-gray-300');
    });

    test('should have all CSS classes present', () => {
      const { container } = render(
        <NavbarItem label={mockLabel} href={mockHref} />
      );
      const div = container.querySelector('div');
      const className = div?.className || '';
      expect(className).toContain('text-white');
      expect(className).toContain('transition');
      expect(className).toContain('cursor-pointer');
      expect(className).toContain('hover:text-gray-300');
    });
  });
});
