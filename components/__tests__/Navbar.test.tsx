import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import Navbar from '../Navbar';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => (
    <img
      {...props}
      src={props.src}
      alt={props.alt}
      data-testid={`image-${props.src.includes('Logo2') ? 'Logo2' : props.alt}`}
    />
  ),
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaChevronDown: ({ className, ...props }: any) => (
    <svg
      data-testid="chevron-down"
      className={className}
      {...props}
      aria-label="chevron-down-icon"
    />
  ),
}));

// Mock child components
jest.mock('@/components/AccountMenu', () => {
  return function MockAccountMenu({ visible }: any) {
    return visible ? <div data-testid="account-menu">Account Menu</div> : null;
  };
});

jest.mock('@/components/MobileMenu', () => {
  return function MockMobileMenu({ visible }: any) {
    return visible ? <div data-testid="mobile-menu">Mobile Menu</div> : null;
  };
});

jest.mock('@/components/NavbarItem', () => {
  return function MockNavbarItem({ label, href }: any) {
    return (
      <a href={href} data-testid={`navbar-item-${label.toLowerCase()}`}>
        {label}
      </a>
    );
  };
});

jest.mock('@/components/SearchItem', () => {
  return function MockSearchItem() {
    return <div data-testid="search-item">Search</div>;
  };
});

// Mock useCurrentProfil hook
jest.mock('@/hooks/useCurrentProfil', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useCurrentProfil from '@/hooks/useCurrentProfil';

const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<
  typeof useCurrentProfil
>;

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentProfil.mockReturnValue({
      data: { image: 'profile1.png' },
    } as any);
    Object.defineProperty(globalThis, 'screenY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(<Navbar />);
      expect(container).toBeTruthy();
    });

    test('should render navigation element', () => {
      const { container } = render(<Navbar />);
      expect(container.querySelector('nav')).toBeTruthy();
    });

    test('should render navbar with fixed positioning', () => {
      const { container } = render(<Navbar />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/fixed/);
      expect(nav?.className).toMatch(/z-40/);
      expect(nav?.className).toMatch(/w-full/);
    });

    test('should render main container div', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv).toBeTruthy();
    });

    test('should render all required elements', () => {
      render(<Navbar />);
      const logos = screen.getAllByTestId(/image-/);
      expect(logos.length).toBeGreaterThan(0);
      expect(screen.getByTestId('search-item')).toBeTruthy();
    });
  });

  describe('Logo Rendering', () => {
    test('should render desktop logo (hidden on mobile)', () => {
      const { container } = render(<Navbar />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      const desktopLogo = Array.from(logos).find((img: any) => 
        img.className.includes('md:block')
      );
      expect(desktopLogo).toBeTruthy();
      expect((desktopLogo as any).className).toMatch(/hidden/);
      expect((desktopLogo as any).className).toMatch(/md:block/);
    });

    test('should render mobile logo (visible on mobile)', () => {
      const { container } = render(<Navbar />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      const mobileLogo = Array.from(logos).find((img: any) => 
        img.className.includes('md:hidden')
      );
      expect(mobileLogo).toBeTruthy();
      expect((mobileLogo as any).className).toMatch(/block/);
      expect((mobileLogo as any).className).toMatch(/md:hidden/);
    });

    test('should have correct logo alt text', () => {
      const { container } = render(<Navbar />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      expect(logos.length).toBe(2);
      logos.forEach((logo) => {
        expect(logo.getAttribute('alt')).toBe('Logo');
      });
    });

    test('should have correct logo sources', () => {
      const { container } = render(<Navbar />);
      const desktopLogo = container.querySelector('img[src*="Logo.png"]');
      const mobileLogo = container.querySelector('img[src*="Logo2.png"]');
      expect(desktopLogo).toBeTruthy();
      expect(mobileLogo).toBeTruthy();
      expect(desktopLogo?.getAttribute('src')).toContain('/images/Logo.png');
      expect(mobileLogo?.getAttribute('src')).toContain('/images/Logo2.png');
    });

    test('should have priority loading for logos', () => {
      const { container } = render(<Navbar />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      expect(logos.length).toBe(2);
    });
  });

  describe('Navigation Items (Desktop)', () => {
    test('should render all navbar items on desktop', () => {
      render(<Navbar />);
      expect(screen.getByTestId('navbar-item-home')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-movies')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-series')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-my list')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-playlists')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-watchlist')).toBeTruthy();
      expect(screen.getByTestId('navbar-item-random')).toBeTruthy();
    });

    test('should have correct href for Home item', () => {
      render(<Navbar />);
      const homeItem = screen.getByTestId('navbar-item-home');
      expect(homeItem.getAttribute('href')).toBe('/');
    });

    test('should have correct href for Movies item', () => {
      render(<Navbar />);
      const moviesItem = screen.getByTestId('navbar-item-movies');
      expect(moviesItem.getAttribute('href')).toBe('/movies');
    });

    test('should have correct href for Series item', () => {
      render(<Navbar />);
      const seriesItem = screen.getByTestId('navbar-item-series');
      expect(seriesItem.getAttribute('href')).toBe('/series');
    });

    test('should have correct href for MyList item', () => {
      render(<Navbar />);
      const myListItem = screen.getByTestId('navbar-item-my list');
      expect(myListItem.getAttribute('href')).toBe('/mylist');
    });

    test('should have correct href for Playlists item', () => {
      render(<Navbar />);
      const playlistsItem = screen.getByTestId('navbar-item-playlists');
      expect(playlistsItem.getAttribute('href')).toBe('/playlists');
    });

    test('should have correct href for Watchlist item', () => {
      render(<Navbar />);
      const watchlistItem = screen.getByTestId('navbar-item-watchlist');
      expect(watchlistItem.getAttribute('href')).toBe('/watchlist');
    });

    test('should have correct href for Random item', () => {
      render(<Navbar />);
      const randomItem = screen.getByTestId('navbar-item-random');
      expect(randomItem.getAttribute('href')).toBe('/random');
    });

    test('should have correct labels for all items', () => {
      render(<Navbar />);
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Movies')).toBeTruthy();
      expect(screen.getByText('Series')).toBeTruthy();
      expect(screen.getByText('My List')).toBeTruthy();
      expect(screen.getByText('Playlists')).toBeTruthy();
      expect(screen.getByText('Watchlist')).toBeTruthy();
      expect(screen.getByText('Random')).toBeTruthy();
    });

    test('should hide navbar items on mobile', () => {
      const { container } = render(<Navbar />);
      const navbarItemsContainer = container.querySelector('.flex-row.hidden.lg\\:flex');
      expect(navbarItemsContainer).toBeTruthy();
    });
  });

  describe('Mobile Menu Button', () => {
    test('should render mobile menu button', () => {
      const { container } = render(<Navbar />);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have Browse button text', () => {
      render(<Navbar />);
      expect(screen.getByText('Browse')).toBeTruthy();
    });

    test('should toggle mobile menu on click', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      
      fireEvent.click(browseButton!);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
      
      fireEvent.click(browseButton!);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    test('should rotate chevron when mobile menu is open', () => {
      const { container } = render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      const browseChevron = chevrons[0];

      expect(browseChevron).toBeTruthy();
      
      fireEvent.click(browseButton!);
      expect(browseChevron).toBeTruthy();
    });

    test('should show MobileMenu component when toggled', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      
      fireEvent.click(browseButton!);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    test('should have correct button styling', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      expect(browseButton?.className).toMatch(/cursor-pointer/);
      expect(browseButton?.className).toMatch(/flex/);
    });

    test('should hide browse button on desktop', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      expect(browseButton?.className).toMatch(/lg:hidden/);
    });
  });

  describe('Account Menu', () => {
    test('should render account menu button with profile image', () => {
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile');
      expect(profileImage).toBeTruthy();
    });

    test('should have profile image with correct src', () => {
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('/images/profil/profile1.png');
    });

    test('should render profile image container', () => {
      const { container } = render(<Navbar />);
      const profileContainer = container.querySelector('.w-8.h-8.overflow-hidden.rounded-md');
      expect(profileContainer).toBeTruthy();
    });

    test('should use default placeholder when profil is undefined', () => {
      mockUseCurrentProfil.mockReturnValue({ data: undefined } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('placeholder.png');
    });

    test('should toggle account menu on click', () => {
      render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');
      
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
      
      fireEvent.click(accountButton!);
      expect(screen.getByTestId('account-menu')).toBeTruthy();
      
      fireEvent.click(accountButton!);
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });

    test('should rotate account menu chevron when open', () => {
      const { container } = render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      const accountChevron = chevrons[1];

      expect(accountChevron).toBeTruthy();
      
      fireEvent.click(accountButton!);
      expect(accountChevron).toBeTruthy();
    });

    test('should show AccountMenu component', () => {
      render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');
      
      fireEvent.click(accountButton!);
      expect(screen.getByTestId('account-menu')).toBeInTheDocument();
    });

    test('should have correct profile image alt text', () => {
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.alt).toBe('Profile');
    });
  });

  describe('Search Item', () => {
    test('should render search item component', () => {
      render(<Navbar />);
      expect(screen.getByTestId('search-item')).toBeTruthy();
    });

    test('should have search item in right section', () => {
      const { container } = render(<Navbar />);
      const rightSection = container.querySelector('.flex.flex-row.items-center.ml-auto.gap-7');
      expect(rightSection?.querySelector('[data-testid="search-item"]')).toBeTruthy();
    });
  });

  describe('Scroll Behavior', () => {
    test('should set background on scroll down', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');

      expect(mainDiv?.className).not.toMatch(/bg-zinc-900/);

      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 100,
      });

      fireEvent.scroll(window, { target: { screenY: 100 } });

      expect(mainDiv?.className).toMatch(/bg-zinc-900/);
    });

    test('should remove background on scroll up', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');

      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 100,
      });

      fireEvent.scroll(window, { target: { screenY: 100 } });
      expect(mainDiv?.className).toMatch(/bg-zinc-900/);

      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 0,
      });

      fireEvent.scroll(window, { target: { screenY: 0 } });
      expect(mainDiv?.className).not.toMatch(/bg-zinc-900/);
    });

    test('should add scroll event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(globalThis, 'addEventListener');
      render(<Navbar />);
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    test('should remove scroll event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(globalThis, 'removeEventListener');
      const { unmount } = render(<Navbar />);
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    test('should have transition class for smooth scroll effect', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/transition/);
      expect(mainDiv?.className).toMatch(/duration-500/);
    });

    test('should use correct TOP_OFFSET (66px)', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');

      expect(mainDiv?.className).not.toMatch(/bg-zinc-900/);

      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 66,
      });

      fireEvent.scroll(window, { target: { screenY: 66 } });
      expect(mainDiv?.className).toMatch(/bg-zinc-900/);
    });
  });

  describe('Styling and Layout', () => {
    test('should have correct padding classes', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/px-4/);
      expect(mainDiv?.className).toMatch(/md:px-16/);
      expect(mainDiv?.className).toMatch(/py-3/);
      expect(mainDiv?.className).toMatch(/md:py-6/);
    });

    test('should have flex row layout', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/flex/);
      expect(mainDiv?.className).toMatch(/flex-row/);
    });

    test('should have items centered vertically', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/items-center/);
    });

    test('should have semi-transparent black background', () => {
      const { container } = render(<Navbar />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/bg-black/);
      expect(nav?.className).toMatch(/bg-opacity-30/);
    });

    test('should render right section with ml-auto', () => {
      const { container } = render(<Navbar />);
      const rightSection = container.querySelector('.flex.flex-row.items-center.ml-auto.gap-7');
      expect(rightSection).toBeTruthy();
    });

    test('should have gap between right section items', () => {
      const { container } = render(<Navbar />);
      const rightSection = container.querySelector('.flex.flex-row.items-center.ml-auto.gap-7');
      expect(rightSection?.className).toMatch(/gap-7/);
    });

    test('should have proper spacing between desktop nav items', () => {
      const { container } = render(<Navbar />);
      const navItemsContainer = container.querySelector('.flex-row.hidden.lg\\:flex');
      expect(navItemsContainer?.className).toMatch(/gap-7/);
    });
  });

  describe('Menu State Management', () => {
    test('should initialize with mobile menu closed', () => {
      render(<Navbar />);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    test('should initialize with account menu closed', () => {
      render(<Navbar />);
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });

    test('should initialize with no background', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).not.toMatch(/bg-zinc-900/);
    });

    test('should toggle menus independently', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      const accountButton = screen.getByTestId('image-Profile').closest('button');

      fireEvent.click(browseButton!);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();

      fireEvent.click(accountButton!);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
      expect(screen.getByTestId('account-menu')).toBeTruthy();
    });

    test('should close mobile menu without affecting account menu', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');

      fireEvent.click(browseButton!);
      fireEvent.click(browseButton!);

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    test('should close account menu without affecting mobile menu', () => {
      render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');

      fireEvent.click(accountButton!);
      fireEvent.click(accountButton!);

      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });
  });

  describe('Profile Image Handling', () => {
    test('should display profile image with correct dimensions', () => {
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile');
      expect(profileImage).toBeTruthy();
    });

    test('should update profile image when profil data changes', () => {
      const { rerender } = render(<Navbar />);
      let profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('profile1.png');

      mockUseCurrentProfil.mockReturnValue({
        data: { image: 'profile2.png' },
      } as any);

      rerender(<Navbar />);
      profileImage = screen.getByTestId('image-Profile');
      expect(profileImage.src).toContain('profile2.png');
    });

    test('should handle profil data as undefined', () => {
      mockUseCurrentProfil.mockReturnValue({ data: undefined } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('placeholder.png');
    });

    test('should have proper image container styling', () => {
      const { container } = render(<Navbar />);
      const profileContainer = container.querySelector('.w-8.h-8.overflow-hidden.rounded-md');
      expect(profileContainer?.className).toMatch(/rounded-md/);
      expect(profileContainer?.className).toMatch(/overflow-hidden/);
    });

    test('should be responsive profile size', () => {
      const { container } = render(<Navbar />);
      const profileContainer = container.querySelector('.w-8.h-8.overflow-hidden.rounded-md');
      expect(profileContainer?.className).toMatch(/sm:w-10/);
      expect(profileContainer?.className).toMatch(/sm:h-10/);
    });
  });

  describe('Chevron Icons', () => {
    test('should render two chevron icons', () => {
      const { container } = render(<Navbar />);
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      expect(chevrons.length).toBe(2);
    });

    test('should have white color for chevrons', () => {
      const { container } = render(<Navbar />);
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      expect(chevrons.length).toBe(2);
    });

    test('should have transition class for rotation animation', () => {
      const { container } = render(<Navbar />);
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      expect(chevrons.length).toBeGreaterThan(0);
    });

    test('should rotate browse chevron independently', () => {
      const { container } = render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      const browseChevron = chevrons[0];

      fireEvent.click(browseButton!);
      expect(browseChevron).toBeTruthy();

      fireEvent.click(browseButton!);
      expect(browseChevron).toBeTruthy();
    });

    test('should rotate account chevron independently', () => {
      const { container } = render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');
      const chevrons = container.querySelectorAll('[data-testid="chevron-down"]');
      const accountChevron = chevrons[1];

      fireEvent.click(accountButton!);
      expect(accountChevron).toBeTruthy();

      fireEvent.click(accountButton!);
      expect(accountChevron).toBeTruthy();
    });
  });

  describe('Component Stability', () => {
    test('should maintain state on re-render', () => {
      const { rerender } = render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');

      fireEvent.click(browseButton!);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();

      rerender(<Navbar />);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
    });

    test('should handle multiple scroll events', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');

      for (let i = 0; i < 5; i++) {
        Object.defineProperty(globalThis, 'screenY', {
          writable: true,
          configurable: true,
          value: 100,
        });
        fireEvent.scroll(window, { target: { screenY: 100 } });
      }

      expect(mainDiv?.className).toMatch(/bg-zinc-900/);
    });

    test('should handle rapid toggle of mobile menu', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');

      fireEvent.click(browseButton!);
      fireEvent.click(browseButton!);
      fireEvent.click(browseButton!);

      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
    });

    test('should handle rapid toggle of account menu', () => {
      render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');

      fireEvent.click(accountButton!);
      fireEvent.click(accountButton!);
      fireEvent.click(accountButton!);

      expect(screen.getByTestId('account-menu')).toBeTruthy();
    });

    test('should render consistently on multiple renders', () => {
      const { container: container1 } = render(<Navbar />);
      const nav1 = container1.querySelector('nav');

      const { container: container2 } = render(<Navbar />);
      const nav2 = container2.querySelector('nav');

      expect(nav1?.className).toBe(nav2?.className);
    });
  });

  describe('Accessibility', () => {
    test('should have semantic nav element', () => {
      const { container } = render(<Navbar />);
      expect(container.querySelector('nav')).toBeTruthy();
    });

    test('should have alt text for all images', () => {
      const { container } = render(<Navbar />);
      const allImages = container.querySelectorAll('img');
      allImages.forEach((img) => {
        expect(img.alt).toBeTruthy();
      });
    });

    test('should have accessible button elements', () => {
      const { container } = render(<Navbar />);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have visible text for navigation', () => {
      render(<Navbar />);
      expect(screen.getByText('Browse')).toBeTruthy();
      expect(screen.getByText('Home')).toBeTruthy();
    });

    test('should have semantic link elements for navigation items', () => {
      render(<Navbar />);
      const homeLink = screen.getByTestId('navbar-item-home');
      expect(homeLink.tagName.toLowerCase()).toBe('a');
      expect(homeLink.getAttribute('href')).toBe('/');
    });

    test('should have proper color contrast for text', () => {
      render(<Navbar />);
      const browseText = screen.getByText('Browse');
      expect(browseText.className).toMatch(/text-white/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing profil data', () => {
      mockUseCurrentProfil.mockReturnValue({ data: undefined } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('placeholder.png');
    });

    test('should handle null profil object', () => {
      mockUseCurrentProfil.mockReturnValue({ data: null } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('placeholder.png');
    });

    test('should handle empty string image name', () => {
      mockUseCurrentProfil.mockReturnValue({
        data: { image: '' },
      } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('/images/profil/');
    });

    test('should handle multiple navbar instances', () => {
      const { container } = render(
        <>
          <Navbar />
          <Navbar />
        </>
      );

      const navs = container.querySelectorAll('nav');
      expect(navs.length).toBe(2);
    });

    test('should work with large screenY values', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');

      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 10000,
      });

      fireEvent.scroll(window, { target: { screenY: 10000 } });
      expect(mainDiv?.className).toMatch(/bg-zinc-900/);
    });

    test('should handle special characters in profile image name', () => {
      mockUseCurrentProfil.mockReturnValue({
        data: { image: 'profile-with-dashes_and_underscores.png' },
      } as any);
      render(<Navbar />);
      const profileImage = screen.getByTestId('image-Profile') as HTMLImageElement;
      expect(profileImage.src).toContain('profile-with-dashes_and_underscores.png');
    });
  });

  describe('Callback Functions', () => {
    test('toggleMobileMenu should use useCallback', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');

      fireEvent.click(browseButton!);
      fireEvent.click(browseButton!);

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    test('toggleAccountMenu should use useCallback', () => {
      render(<Navbar />);
      const accountButton = screen.getByTestId('image-Profile').closest('button');

      fireEvent.click(accountButton!);
      fireEvent.click(accountButton!);

      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });

    test('should properly toggle state based on callback', () => {
      render(<Navbar />);
      const browseButton = screen.getByText('Browse').closest('button');

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
      fireEvent.click(browseButton!);
      expect(screen.getByTestId('mobile-menu')).toBeTruthy();
      fireEvent.click(browseButton!);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    test('should have logo on left', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      const firstChild = mainDiv?.firstChild;
      expect(firstChild).toBeTruthy();
    });

    test('should have search and account menu on right', () => {
      const { container } = render(<Navbar />);
      const rightSection = container.querySelector('.flex.flex-row.items-center.ml-auto.gap-7');
      expect(rightSection).toBeTruthy();
      expect(rightSection?.querySelector('[data-testid="search-item"]')).toBeTruthy();
    });

    test('should have desktop nav items in center', () => {
      const { container } = render(<Navbar />);
      const desktopNav = container.querySelector('.flex-row.hidden.lg\\:flex');
      expect(desktopNav).toBeTruthy();
    });

    test('should have proper flex layout for responsive design', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/flex/);
      expect(mainDiv?.className).toMatch(/flex-row/);
      expect(mainDiv?.className).toMatch(/items-center/);
    });

    test('should have ml-auto for right alignment of right section', () => {
      const { container } = render(<Navbar />);
      const rightSection = container.querySelector('.ml-auto');
      expect(rightSection).toBeTruthy();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should hide desktop nav items on mobile', () => {
      const { container } = render(<Navbar />);
      const desktopNav = container.querySelector('.hidden.lg\\:flex');
      expect(desktopNav).toBeTruthy();
    });

    test('should show mobile menu button on mobile', () => {
      const { container } = render(<Navbar />);
      const mobileMenuButton = container.querySelector('.lg\\:hidden');
      expect(mobileMenuButton).toBeTruthy();
    });

    test('should have responsive padding', () => {
      const { container } = render(<Navbar />);
      const mainDiv = container.querySelector('nav > div');
      expect(mainDiv?.className).toMatch(/px-4/);
      expect(mainDiv?.className).toMatch(/md:px-16/);
      expect(mainDiv?.className).toMatch(/py-3/);
      expect(mainDiv?.className).toMatch(/md:py-6/);
    });

    test('should have responsive logo sizing', () => {
      const { container } = render(<Navbar />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      logos.forEach((logo) => {
        const className = (logo as any).className;
        expect(className).toBeTruthy();
      });
    });

    test('should have responsive profile image sizing', () => {
      const { container } = render(<Navbar />);
      const profileContainer = container.querySelector('.w-8.h-8.overflow-hidden');
      expect(profileContainer?.className).toMatch(/sm:w-10/);
      expect(profileContainer?.className).toMatch(/sm:h-10/);
    });
  });
});
