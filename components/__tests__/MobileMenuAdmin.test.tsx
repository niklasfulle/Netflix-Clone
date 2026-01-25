import React from 'react';
import { render, screen } from '@testing-library/react';
import MobileMenuAdmin from '../MobileMenuAdmin';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  );
});

describe('MobileMenuAdmin', () => {
  describe('Visibility', () => {
    test('should render when visible is true', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.querySelector('div');
      expect(menu).toBeTruthy();
    });

    test('should not render when visible is false', () => {
      const { container } = render(<MobileMenuAdmin visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when visible is undefined', () => {
      const { container } = render(<MobileMenuAdmin />);
      expect(container.firstChild).toBeNull();
    });

    test('should render menu content when visible is true', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toBeTruthy();
    });

    test('should have proper div structure', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/absolute/);
      expect(mainDiv?.className).toMatch(/flex/);
    });
  });

  describe('Navigation Links', () => {
    test('should render Home link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toBeTruthy();
    });

    test('should render User link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const userLink = screen.getByText('User');
      expect(userLink).toBeTruthy();
    });

    test('should render Actors link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const actorsLink = screen.getByText('Actors');
      expect(actorsLink).toBeTruthy();
    });

    test('should render Movies/Series link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const moviesLink = screen.getByText('Movies/Series');
      expect(moviesLink).toBeTruthy();
    });

    test('should render Statistics link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const statsLink = screen.getByText('Statistics');
      expect(statsLink).toBeTruthy();
    });

    test('should render Logs link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const logsLink = screen.getByText('Logs');
      expect(logsLink).toBeTruthy();
    });

    test('should render all 6 links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(6);
    });
  });

  describe('Link hrefs', () => {
    test('should have correct Home link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      expect(homeLink.getAttribute('href')).toBe('/');
    });

    test('should have correct User link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const userLink = screen.getByTestId('link-/admin/users');
      expect(userLink.getAttribute('href')).toBe('/admin/users');
    });

    test('should have correct Actors link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const actorsLink = screen.getByTestId('link-/admin/actors');
      expect(actorsLink.getAttribute('href')).toBe('/admin/actors');
    });

    test('should have correct Movies link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const moviesLink = screen.getByTestId('link-/admin/movies');
      expect(moviesLink.getAttribute('href')).toBe('/admin/movies');
    });

    test('should have correct Statistics link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const statsLink = screen.getByTestId('link-/admin/statistics');
      expect(statsLink.getAttribute('href')).toBe('/admin/statistics');
    });

    test('should have correct Logs link href', () => {
      render(<MobileMenuAdmin visible={true} />);
      const logsLink = screen.getByTestId('link-/admin/logs');
      expect(logsLink.getAttribute('href')).toBe('/admin/logs');
    });
  });

  describe('Styling', () => {
    test('should have absolute positioning', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/absolute/);
    });

    test('should have left-0 class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/left-0/);
    });

    test('should have flex class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex/);
    });

    test('should have flex-col class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex-col/);
    });

    test('should have width class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/w-/);
    });

    test('should have py-4 class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/py-4/);
    });

    test('should have bg-black class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/bg-black/);
    });

    test('should have border class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/border/);
    });

    test('should have border-gray-800 class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/border-gray-800/);
    });

    test('should have top-8 class', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/top-8/);
    });

    test('should have text-white on links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/text-white/);
    });

    test('should have hover:underline on links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/hover:underline/);
    });

    test('should have px-3 on link containers', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/px-3/);
    });

    test('should have text-center on links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/text-center/);
    });
  });

  describe('Container Structure', () => {
    test('should have flex container inside main div', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      expect(flexDiv?.className).toMatch(/flex/);
      expect(flexDiv?.className).toMatch(/flex-col/);
    });

    test('should have gap-4 in flex container', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      expect(flexDiv?.className).toMatch(/gap-4/);
    });

    test('should have 6 child link elements', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      const linkElements = flexDiv?.querySelectorAll('a');
      expect(linkElements?.length).toBe(6);
    });
  });

  describe('Props Handling', () => {
    test('should accept visible prop as true', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      expect(container.firstChild).toBeTruthy();
    });

    test('should accept visible prop as false', () => {
      const { container } = render(<MobileMenuAdmin visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('should default to not visible when prop omitted', () => {
      const { container } = render(<MobileMenuAdmin />);
      expect(container.firstChild).toBeNull();
    });

    test('should handle prop changes', () => {
      const { container, rerender } = render(<MobileMenuAdmin visible={false} />);
      expect(container.firstChild).toBeNull();
      rerender(<MobileMenuAdmin visible={true} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Link Accessibility', () => {
    test('should have accessible link elements', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('should have text content in all links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy();
        expect(link.textContent?.length).toBeGreaterThan(0);
      });
    });

    test('should have href attribute on all links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.getAttribute('href')).toBeTruthy();
      });
    });
  });

  describe('Component Stability', () => {
    test('should render consistently when visible', () => {
      const { rerender } = render(<MobileMenuAdmin visible={true} />);
      const first = screen.getAllByRole('link').length;
      rerender(<MobileMenuAdmin visible={true} />);
      const second = screen.getAllByRole('link').length;
      expect(first).toBe(second);
    });

    test('should not throw on mount', () => {
      expect(() => {
        render(<MobileMenuAdmin visible={true} />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<MobileMenuAdmin visible={true} />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle rapid visibility toggling', () => {
      const { rerender } = render(<MobileMenuAdmin visible={true} />);
      rerender(<MobileMenuAdmin visible={false} />);
      rerender(<MobileMenuAdmin visible={true} />);
      rerender(<MobileMenuAdmin visible={false} />);
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle visible prop with other falsy values', () => {
      const { container: container1 } = render(
        <MobileMenuAdmin visible={false} />
      );
      expect(container1.firstChild).toBeNull();
    });

    test('should render with all links when visible is true', () => {
      render(<MobileMenuAdmin visible={true} />);
      const expectedLinks = ['Home', 'User', 'Actors', 'Movies/Series', 'Statistics', 'Logs'];
      expectedLinks.forEach((linkText) => {
        expect(screen.getByText(linkText)).toBeTruthy();
      });
    });

    test('should not render any links when invisible', () => {
      const { container } = render(<MobileMenuAdmin visible={false} />);
      const links = container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });

    test('should maintain correct structure when toggled multiple times', () => {
      const { rerender } = render(<MobileMenuAdmin visible={false} />);
      for (let i = 0; i < 5; i++) {
        rerender(<MobileMenuAdmin visible={true} />);
        expect(screen.getAllByRole('link').length).toBe(6);
        rerender(<MobileMenuAdmin visible={false} />);
      }
    });
  });

  describe('Link Order', () => {
    test('should render links in correct order', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      const expectedOrder = ['/', '/admin/users', '/admin/actors', '/admin/movies', '/admin/statistics', '/admin/logs'];
      
      links.forEach((link, index) => {
        expect(link.getAttribute('href')).toBe(expectedOrder[index]);
      });
    });

    test('should have Home as first link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links[0].getAttribute('href')).toBe('/');
    });

    test('should have Logs as last link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links[links.length - 1].getAttribute('href')).toBe('/admin/logs');
    });
  });

  describe('Text Content', () => {
    test('should have correct text for Home link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      expect(homeLink.textContent).toBe('Home');
    });

    test('should have correct text for User link', () => {
      render(<MobileMenuAdmin visible={true} />);
      const userLink = screen.getByTestId('link-/admin/users');
      expect(userLink.textContent).toBe('User');
    });

    test('should have correct text for all links', () => {
      render(<MobileMenuAdmin visible={true} />);
      const expectedTexts = ['Home', 'User', 'Actors', 'Movies/Series', 'Statistics', 'Logs'];
      const links = screen.getAllByRole('link');
      
      links.forEach((link, index) => {
        expect(link.textContent).toBe(expectedTexts[index]);
      });
    });
  });

  describe('Menu Positioning', () => {
    test('should have position absolute', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/absolute/);
    });

    test('should be positioned at left-0', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/left-0/);
    });

    test('should be positioned at top-8', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/top-8/);
    });

    test('should have proper styling for positioning', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      const classes = menu.className;
      expect(classes).toMatch(/absolute/);
      expect(classes).toMatch(/left-0/);
      expect(classes).toMatch(/top-8/);
    });
  });

  describe('Menu Background', () => {
    test('should have black background', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/bg-black/);
    });

    test('should have border styling', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      const classes = menu.className;
      expect(classes).toMatch(/border/);
      expect(classes).toMatch(/border-gray/);
    });
  });

  describe('Menu Display', () => {
    test('should render as flex container', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/flex/);
    });

    test('should display items in column direction', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const innerDiv = (container.firstChild as HTMLElement).querySelector('div');
      expect(innerDiv?.className).toMatch(/flex-col/);
    });

    test('should have gap between items', () => {
      const { container } = render(<MobileMenuAdmin visible={true} />);
      const innerDiv = (container.firstChild as HTMLElement).querySelector('div');
      expect(innerDiv?.className).toMatch(/gap/);
    });
  });
});
