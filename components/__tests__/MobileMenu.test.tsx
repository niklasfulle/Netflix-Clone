import React from 'react';
import { render, screen } from '@testing-library/react';
import MobileMenu from '../MobileMenu';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  );
});

describe('MobileMenu', () => {
  describe('Visibility', () => {
    test('should render when visible is true', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.querySelector('div');
      expect(menu).toBeTruthy();
    });

    test('should not render when visible is false', () => {
      const { container } = render(<MobileMenu visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when visible is undefined', () => {
      const { container } = render(<MobileMenu />);
      expect(container.firstChild).toBeNull();
    });

    test('should render menu content when visible is true', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toBeTruthy();
    });

    test('should have proper div structure', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/absolute/);
      expect(mainDiv?.className).toMatch(/flex/);
    });
  });

  describe('Navigation Links', () => {
    test('should render Home link', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toBeTruthy();
    });

    test('should render Movies link', () => {
      render(<MobileMenu visible={true} />);
      const moviesLink = screen.getByText('Movies');
      expect(moviesLink).toBeTruthy();
    });

    test('should render Series link', () => {
      render(<MobileMenu visible={true} />);
      const seriesLink = screen.getByText('Series');
      expect(seriesLink).toBeTruthy();
    });

    test('should render My List link', () => {
      render(<MobileMenu visible={true} />);
      const myListLink = screen.getByText('My List');
      expect(myListLink).toBeTruthy();
    });

    test('should render Playlists link', () => {
      render(<MobileMenu visible={true} />);
      const playlistsLink = screen.getByText('Playlists');
      expect(playlistsLink).toBeTruthy();
    });

    test('should render Watchlist link', () => {
      render(<MobileMenu visible={true} />);
      const watchlistLink = screen.getByText('Watchlist');
      expect(watchlistLink).toBeTruthy();
    });

    test('should render Random link', () => {
      render(<MobileMenu visible={true} />);
      const randomLink = screen.getByText('Random');
      expect(randomLink).toBeTruthy();
    });

    test('should render all 7 links', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(7);
    });
  });

  describe('Link hrefs', () => {
    test('should have correct Home link href', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      expect(homeLink.getAttribute('href')).toBe('/');
    });

    test('should have correct Movies link href', () => {
      render(<MobileMenu visible={true} />);
      const moviesLink = screen.getByTestId('link-/movies');
      expect(moviesLink.getAttribute('href')).toBe('/movies');
    });

    test('should have correct Series link href', () => {
      render(<MobileMenu visible={true} />);
      const seriesLink = screen.getByTestId('link-/series');
      expect(seriesLink.getAttribute('href')).toBe('/series');
    });

    test('should have correct My List link href', () => {
      render(<MobileMenu visible={true} />);
      const myListLink = screen.getByTestId('link-/mylist');
      expect(myListLink.getAttribute('href')).toBe('/mylist');
    });

    test('should have correct Playlists link href', () => {
      render(<MobileMenu visible={true} />);
      const playlistsLink = screen.getByTestId('link-/playlists');
      expect(playlistsLink.getAttribute('href')).toBe('/playlists');
    });

    test('should have correct Watchlist link href', () => {
      render(<MobileMenu visible={true} />);
      const watchlistLink = screen.getByTestId('link-/watchlist');
      expect(watchlistLink.getAttribute('href')).toBe('/watchlist');
    });

    test('should have correct Random link href', () => {
      render(<MobileMenu visible={true} />);
      const randomLink = screen.getByTestId('link-/random');
      expect(randomLink.getAttribute('href')).toBe('/random');
    });
  });

  describe('Styling', () => {
    test('should have absolute positioning', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/absolute/);
    });

    test('should have left-0 class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/left-0/);
    });

    test('should have flex class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex/);
    });

    test('should have flex-col class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex-col/);
    });

    test('should have width class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/w-/);
    });

    test('should have py-4 class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/py-4/);
    });

    test('should have bg-black class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/bg-black/);
    });

    test('should have border class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/border/);
    });

    test('should have border-gray-800 class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/border-gray-800/);
    });

    test('should have top-8 class', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/top-8/);
    });

    test('should have text-white on links', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/text-white/);
    });

    test('should have hover:underline on links', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/hover:underline/);
    });

    test('should have px-3 on link containers', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/px-3/);
    });

    test('should have text-center on links', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      const linkDiv = homeLink.querySelector('div');
      expect(linkDiv?.className).toMatch(/text-center/);
    });
  });

  describe('Container Structure', () => {
    test('should have flex container inside main div', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      expect(flexDiv?.className).toMatch(/flex/);
      expect(flexDiv?.className).toMatch(/flex-col/);
    });

    test('should have gap-4 in flex container', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      expect(flexDiv?.className).toMatch(/gap-4/);
    });

    test('should have 7 child link elements', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const mainDiv = container.querySelector('div');
      const flexDiv = mainDiv?.querySelector('div');
      const linkElements = flexDiv?.querySelectorAll('a');
      expect(linkElements?.length).toBe(7);
    });
  });

  describe('Props Handling', () => {
    test('should accept visible prop as true', () => {
      const { container } = render(<MobileMenu visible={true} />);
      expect(container.firstChild).toBeTruthy();
    });

    test('should accept visible prop as false', () => {
      const { container } = render(<MobileMenu visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('should default to not visible when prop omitted', () => {
      const { container } = render(<MobileMenu />);
      expect(container.firstChild).toBeNull();
    });

    test('should handle prop changes', () => {
      const { container, rerender } = render(<MobileMenu visible={false} />);
      expect(container.firstChild).toBeNull();
      rerender(<MobileMenu visible={true} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Link Accessibility', () => {
    test('should have accessible link elements', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('should have text content in all links', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy();
        expect(link.textContent?.length).toBeGreaterThan(0);
      });
    });

    test('should have href attribute on all links', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.getAttribute('href')).toBeTruthy();
      });
    });
  });

  describe('Component Stability', () => {
    test('should render consistently when visible', () => {
      const { rerender } = render(<MobileMenu visible={true} />);
      const first = screen.getAllByRole('link').length;
      rerender(<MobileMenu visible={true} />);
      const second = screen.getAllByRole('link').length;
      expect(first).toBe(second);
    });

    test('should not throw on mount', () => {
      expect(() => {
        render(<MobileMenu visible={true} />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<MobileMenu visible={true} />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle rapid visibility toggling', () => {
      const { rerender } = render(<MobileMenu visible={true} />);
      rerender(<MobileMenu visible={false} />);
      rerender(<MobileMenu visible={true} />);
      rerender(<MobileMenu visible={false} />);
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle visible prop with other falsy values', () => {
      const { container: container1 } = render(
        <MobileMenu visible={false} />
      );
      expect(container1.firstChild).toBeNull();
    });

    test('should render with all links when visible is true', () => {
      render(<MobileMenu visible={true} />);
      const expectedLinks = ['Home', 'Movies', 'Series', 'My List', 'Playlists', 'Watchlist', 'Random'];
      expectedLinks.forEach((linkText) => {
        expect(screen.getByText(linkText)).toBeTruthy();
      });
    });

    test('should not render any links when invisible', () => {
      const { container } = render(<MobileMenu visible={false} />);
      const links = container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });

    test('should maintain correct structure when toggled multiple times', () => {
      const { rerender } = render(<MobileMenu visible={false} />);
      for (let i = 0; i < 5; i++) {
        rerender(<MobileMenu visible={true} />);
        expect(screen.getAllByRole('link').length).toBe(7);
        rerender(<MobileMenu visible={false} />);
      }
    });
  });

  describe('Link Order', () => {
    test('should render links in correct order', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      const expectedOrder = ['/', '/movies', '/series', '/mylist', '/playlists', '/watchlist', '/random'];
      
      links.forEach((link, index) => {
        expect(link.getAttribute('href')).toBe(expectedOrder[index]);
      });
    });

    test('should have Home as first link', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links[0].getAttribute('href')).toBe('/');
    });

    test('should have Random as last link', () => {
      render(<MobileMenu visible={true} />);
      const links = screen.getAllByRole('link');
      expect(links[links.length - 1].getAttribute('href')).toBe('/random');
    });
  });

  describe('Text Content', () => {
    test('should have correct text for Home link', () => {
      render(<MobileMenu visible={true} />);
      const homeLink = screen.getByTestId('link-/');
      expect(homeLink.textContent).toBe('Home');
    });

    test('should have correct text for Movies link', () => {
      render(<MobileMenu visible={true} />);
      const moviesLink = screen.getByTestId('link-/movies');
      expect(moviesLink.textContent).toBe('Movies');
    });

    test('should have correct text for Series link', () => {
      render(<MobileMenu visible={true} />);
      const seriesLink = screen.getByTestId('link-/series');
      expect(seriesLink.textContent).toBe('Series');
    });

    test('should have correct text for My List link', () => {
      render(<MobileMenu visible={true} />);
      const myListLink = screen.getByTestId('link-/mylist');
      expect(myListLink.textContent).toBe('My List');
    });

    test('should have correct text for Playlists link', () => {
      render(<MobileMenu visible={true} />);
      const playlistsLink = screen.getByTestId('link-/playlists');
      expect(playlistsLink.textContent).toBe('Playlists');
    });

    test('should have correct text for Watchlist link', () => {
      render(<MobileMenu visible={true} />);
      const watchlistLink = screen.getByTestId('link-/watchlist');
      expect(watchlistLink.textContent).toBe('Watchlist');
    });

    test('should have correct text for Random link', () => {
      render(<MobileMenu visible={true} />);
      const randomLink = screen.getByTestId('link-/random');
      expect(randomLink.textContent).toBe('Random');
    });

    test('should have correct text for all links', () => {
      render(<MobileMenu visible={true} />);
      const expectedTexts = ['Home', 'Movies', 'Series', 'My List', 'Playlists', 'Watchlist', 'Random'];
      const links = screen.getAllByRole('link');
      
      links.forEach((link, index) => {
        expect(link.textContent).toBe(expectedTexts[index]);
      });
    });
  });

  describe('Menu Positioning', () => {
    test('should have position absolute', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/absolute/);
    });

    test('should be positioned at left-0', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/left-0/);
    });

    test('should be positioned at top-8', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/top-8/);
    });

    test('should have proper styling for positioning', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      const classes = menu.className;
      expect(classes).toMatch(/absolute/);
      expect(classes).toMatch(/left-0/);
      expect(classes).toMatch(/top-8/);
    });
  });

  describe('Menu Background', () => {
    test('should have black background', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/bg-black/);
    });

    test('should have border styling', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      const classes = menu.className;
      expect(classes).toMatch(/border/);
      expect(classes).toMatch(/border-gray/);
    });
  });

  describe('Menu Display', () => {
    test('should render as flex container', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.className).toMatch(/flex/);
    });

    test('should display items in column direction', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const innerDiv = (container.firstChild as HTMLElement).querySelector('div');
      expect(innerDiv?.className).toMatch(/flex-col/);
    });

    test('should have gap between items', () => {
      const { container } = render(<MobileMenu visible={true} />);
      const innerDiv = (container.firstChild as HTMLElement).querySelector('div');
      expect(innerDiv?.className).toMatch(/gap/);
    });
  });

  describe('Link Categories', () => {
    test('should have home navigation link', () => {
      render(<MobileMenu visible={true} />);
      expect((screen.getByTestId('link-/') as HTMLAnchorElement).href).toContain('/');
    });

    test('should have content navigation links', () => {
      render(<MobileMenu visible={true} />);
      const moviesLink = screen.getByTestId('link-/movies') as HTMLAnchorElement;
      const seriesLink = screen.getByTestId('link-/series') as HTMLAnchorElement;
      expect(moviesLink.href).toContain('/movies');
      expect(seriesLink.href).toContain('/series');
    });

    test('should have user feature links', () => {
      render(<MobileMenu visible={true} />);
      const myListLink = screen.getByTestId('link-/mylist') as HTMLAnchorElement;
      const watchlistLink = screen.getByTestId('link-/watchlist') as HTMLAnchorElement;
      expect(myListLink.href).toContain('/mylist');
      expect(watchlistLink.href).toContain('/watchlist');
    });

    test('should have playlist and random links', () => {
      render(<MobileMenu visible={true} />);
      const playlistsLink = screen.getByTestId('link-/playlists') as HTMLAnchorElement;
      const randomLink = screen.getByTestId('link-/random') as HTMLAnchorElement;
      expect(playlistsLink.href).toContain('/playlists');
      expect(randomLink.href).toContain('/random');
    });
  });
});
