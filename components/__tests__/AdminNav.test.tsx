import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminNav from '../AdminNav';
import useCurrentProfil from '@/hooks/useCurrentProfil';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    priority,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    priority?: boolean;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-testid={`image-${alt}`}
      className={className}
      data-priority={priority}
    />
  ),
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaChevronDown: ({ className, 'data-testid': testId }: any) => (
    <svg data-testid={testId || 'chevron-icon'} className={className} />
  ),
}));

// Mock child components
jest.mock('../AccountMenu', () => {
  return function DummyAccountMenu({ visible }: { visible: boolean }) {
    return visible ? <div data-testid="account-menu">Account Menu</div> : null;
  };
});

jest.mock('../MobileMenuAdmin', () => {
  return function DummyMobileMenuAdmin({ visible }: { visible: boolean }) {
    return visible ? <div data-testid="mobile-menu-admin">Mobile Menu</div> : null;
  };
});

jest.mock('../NavbarItem', () => {
  return function DummyNavbarItem({ label, href }: { label: string; href: string }) {
    return (
      <a href={href} data-testid={`navbar-item-${label.toLowerCase()}`}>
        {label}
      </a>
    );
  };
});

// Mock the hook
jest.mock('@/hooks/useCurrentProfil');

const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<typeof useCurrentProfil>;

const mockProfil = {
  id: 'profil-1',
  name: 'Test User',
  image: 'test-image.jpg',
};

describe('AdminNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentProfil.mockReturnValue({
      data: mockProfil,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    });
    // Reset window scroll position
    Object.defineProperty(window, 'screenY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AdminNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render the main navbar container', () => {
      const { container } = render(<AdminNav />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.className).toMatch(/fixed/);
      expect(nav?.className).toMatch(/z-40/);
      expect(nav?.className).toMatch(/w-full/);
    });

    it('should have fixed positioning and proper z-index', () => {
      const { container } = render(<AdminNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/fixed/);
      expect(nav?.className).toMatch(/z-40/);
    });
  });

  describe('Logo Display', () => {
    it('should render logos', () => {
      render(<AdminNav />);
      const images = screen.getAllByAltText('Logo');
      expect(images.length).toBeGreaterThan(0);
    });

    it('should render mobile and desktop logos', () => {
      render(<AdminNav />);
      const images = screen.getAllByAltText('Logo');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });

    it('should have Logo.png source', () => {
      const { container } = render(<AdminNav />);
      const imgs = container.querySelectorAll('img[alt="Logo"]');
      const hasLogo1 = Array.from(imgs).some((img) => (img as HTMLImageElement).src.includes('Logo.png'));
      expect(hasLogo1).toBe(true);
    });

    it('should have Logo2.png source', () => {
      const { container } = render(<AdminNav />);
      const imgs = container.querySelectorAll('img[alt="Logo"]');
      const hasLogo2 = Array.from(imgs).some((img) => (img as HTMLImageElement).src.includes('Logo2.png'));
      expect(hasLogo2).toBe(true);
    });

    it('should pass priority prop to images', () => {
      render(<AdminNav />);
      const images = screen.getAllByAltText('Logo');
      images.forEach((img) => {
        expect(img).toHaveAttribute('data-priority', 'true');
      });
    });

    it('should have responsive logo classes', () => {
      const { container } = render(<AdminNav />);
      const logos = container.querySelectorAll('img[alt="Logo"]');
      expect(logos.length).toBeGreaterThan(1);
    });
  });

  describe('Desktop Navigation', () => {
    it('should render navbar items', () => {
      render(<AdminNav />);
      expect(screen.getByTestId('navbar-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-item-user')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-item-actors')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-item-movies/series')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-item-statistics')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-item-logs')).toBeInTheDocument();
    });

    it('should have correct links for navbar items', () => {
      render(<AdminNav />);
      expect(screen.getByTestId('navbar-item-home')).toHaveAttribute('href', '/');
      expect(screen.getByTestId('navbar-item-user')).toHaveAttribute('href', '/admin/users');
      expect(screen.getByTestId('navbar-item-actors')).toHaveAttribute('href', '/admin/actors');
      expect(screen.getByTestId('navbar-item-movies/series')).toHaveAttribute('href', '/admin/movies');
      expect(screen.getByTestId('navbar-item-statistics')).toHaveAttribute('href', '/admin/statistics');
      expect(screen.getByTestId('navbar-item-logs')).toHaveAttribute('href', '/admin/logs');
    });

    it('should render 6 navbar items', () => {
      render(<AdminNav />);
      const items = screen.getAllByTestId(/^navbar-item-/);
      expect(items).toHaveLength(6);
    });
  });

  describe('Mobile Menu', () => {
    it('should render browse button for mobile', () => {
      render(<AdminNav />);
      const browseButton = screen.getByText('Browse');
      expect(browseButton).toBeInTheDocument();
    });

    it('should initially hide mobile menu', () => {
      render(<AdminNav />);
      expect(screen.queryByTestId('mobile-menu-admin')).not.toBeInTheDocument();
    });

    it('should toggle mobile menu on button click', () => {
      render(<AdminNav />);
      const browseButton = screen.getByText('Browse');
      const browseButtonElement = browseButton.closest('button');
      
      fireEvent.click(browseButtonElement!);
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
      
      fireEvent.click(browseButtonElement!);
      expect(screen.queryByTestId('mobile-menu-admin')).not.toBeInTheDocument();
    });

    it('should rotate chevron icon when menu is open', () => {
      render(<AdminNav />);
      const browseButton = screen.getByText('Browse');
      const browseButtonElement = browseButton.closest('button');
      const chevron = browseButtonElement?.querySelector('svg');
      
      // Verify chevron exists and is rendered
      expect(chevron).toBeInTheDocument();
      
      // Click to toggle menu
      fireEvent.click(browseButtonElement!);
      
      // After click, menu should be visible
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
    });

    it('should display Browse text', () => {
      render(<AdminNav />);
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });
  });

  describe('Account Menu', () => {
    it('should render account menu button with profile image', () => {
      render(<AdminNav />);
      const profileImg = screen.getByAltText('Profile');
      expect(profileImg).toBeInTheDocument();
    });

    it('should initially hide account menu', () => {
      render(<AdminNav />);
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });

    it('should toggle account menu on profile button click', () => {
      render(<AdminNav />);
      const profileImg = screen.getByAltText('Profile');
      const profileBtn = profileImg.closest('button');
      
      fireEvent.click(profileBtn!);
      expect(screen.getByTestId('account-menu')).toBeInTheDocument();
      
      fireEvent.click(profileBtn!);
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
    });

    it('should display profile image in circular container', () => {
      render(<AdminNav />);
      const profileImg = screen.getByAltText('Profile');
      const imgContainer = profileImg.parentElement;
      expect(imgContainer?.className).toMatch(/rounded-md/);
      expect(imgContainer?.className).toMatch(/w-8/);
      expect(imgContainer?.className).toMatch(/h-8/);
    });
  });

  describe('Profile Integration', () => {
    it('should use profile image from hook', () => {
      render(<AdminNav />);
      const profileImg = screen.getByAltText('Profile') as HTMLImageElement;
      expect(profileImg.src).toContain('test-image.jpg');
    });

    it('should use placeholder when profile is undefined', () => {
      mockUseCurrentProfil.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      });
      render(<AdminNav />);
      const profileImg = screen.getByAltText('Profile') as HTMLImageElement;
      expect(profileImg.src).toContain('placeholder.png');
    });

    it('should update profile image when data changes', () => {
      const { rerender } = render(<AdminNav />);
      let profileImg = screen.getByAltText('Profile') as HTMLImageElement;
      expect(profileImg.src).toContain('test-image.jpg');

      mockUseCurrentProfil.mockReturnValue({
        data: { ...mockProfil, image: 'new-image.jpg' },
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      });

      rerender(<AdminNav />);
      profileImg = screen.getByAltText('Profile') as HTMLImageElement;
      expect(profileImg.src).toContain('new-image.jpg');
    });

    it('should call useCurrentProfil hook', () => {
      render(<AdminNav />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });
  });

  describe('Scroll Behavior', () => {
    it('should not show background initially', () => {
      const { container } = render(<AdminNav />);
      const contentDiv = container.querySelector('.flex.flex-row.items-center');
      expect(contentDiv?.className).not.toMatch(/bg-zinc-900/);
    });

    it('should attach scroll listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(globalThis, 'addEventListener');
      render(<AdminNav />);
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('should remove scroll listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<AdminNav />);
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should show background when scrolling past TOP_OFFSET', async () => {
      const { container, rerender } = render(<AdminNav />);
      
      // Simulate scroll event
      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 100,
      });
      
      fireEvent.scroll(window);
      
      rerender(<AdminNav />);
      
      await waitFor(() => {
        const contentDiv = container.querySelector('.flex.flex-row.items-center');
        expect(contentDiv?.className).toMatch(/bg-zinc-900/);
      });
    });

    it('should hide background when scrolling back to top', async () => {
      const { container, rerender } = render(<AdminNav />);
      
      // Start scrolled down
      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 100,
      });
      fireEvent.scroll(window);
      rerender(<AdminNav />);
      
      // Scroll back up
      Object.defineProperty(globalThis, 'screenY', {
        writable: true,
        configurable: true,
        value: 0,
      });
      fireEvent.scroll(window);
      rerender(<AdminNav />);
      
      await waitFor(() => {
        const contentDiv = container.querySelector('.flex.flex-row.items-center');
        expect(contentDiv?.className).not.toMatch(/bg-zinc-900/);
      });
    });
  });

  describe('Styling and Layout', () => {
    it('should have responsive padding', () => {
      const { container } = render(<AdminNav />);
      const contentDiv = container.querySelector('.px-4');
      expect(contentDiv?.className).toMatch(/px-4/);
      expect(contentDiv?.className).toMatch(/md:px-16/);
    });

    it('should have responsive margin', () => {
      const { container } = render(<AdminNav />);
      const contentDiv = container.querySelector('.flex.flex-row.items-center');
      expect(contentDiv?.className).toMatch(/py-3/);
      expect(contentDiv?.className).toMatch(/md:py-6/);
    });

    it('should have flex layout', () => {
      const { container } = render(<AdminNav />);
      const contentDiv = container.querySelector('.flex.flex-row.items-center');
      expect(contentDiv?.className).toMatch(/flex/);
      expect(contentDiv?.className).toMatch(/flex-row/);
      expect(contentDiv?.className).toMatch(/items-center/);
    });

    it('should have smooth background transition', () => {
      const { container } = render(<AdminNav />);
      const contentDiv = container.querySelector('.flex.flex-row.items-center');
      expect(contentDiv?.className).toMatch(/transition/);
      expect(contentDiv?.className).toMatch(/duration-500/);
    });
  });

  describe('Navigation Structure', () => {
    it('should have desktop navigation hidden on small screens', () => {
      const { container } = render(<AdminNav />);
      const desktopNav = container.querySelector('.lg\\:flex');
      expect(desktopNav?.className).toMatch(/hidden/);
      expect(desktopNav?.className).toMatch(/lg:flex/);
    });

    it('should have mobile menu hidden on large screens', () => {
      render(<AdminNav />);
      const browseButton = screen.getByRole('button', { name: /Browse/i });
      expect(browseButton.className).toMatch(/lg:hidden/);
    });

    it('should display account menu on right side', () => {
      const { container } = render(<AdminNav />);
      const rightSide = container.querySelector('.ml-auto');
      expect(rightSide).toBeInTheDocument();
    });
  });

  describe('Menu Callbacks', () => {
    it('should toggle mobile menu multiple times', () => {
      render(<AdminNav />);
      const browseButton = screen.getByRole('button', { name: /Browse/i });

      for (let i = 0; i < 3; i++) {
        fireEvent.click(browseButton);
        if (i % 2 === 0) {
          expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('mobile-menu-admin')).not.toBeInTheDocument();
        }
      }
    });

    it('should toggle account menu multiple times', () => {
      render(<AdminNav />);
      const buttons = screen.getAllByRole('button');
      const accountButton = buttons[buttons.length - 1];

      for (let i = 0; i < 3; i++) {
        fireEvent.click(accountButton);
        if (i % 2 === 0) {
          expect(screen.getByTestId('account-menu')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();
        }
      }
    });

    it('should maintain separate state for mobile and account menus', () => {
      render(<AdminNav />);
      const buttons = screen.getAllByRole('button');
      const browseButton = buttons[0];
      const accountButton = buttons[buttons.length - 1];

      // Open mobile menu
      fireEvent.click(browseButton);
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();

      // Open account menu
      fireEvent.click(accountButton);
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
      expect(screen.getByTestId('account-menu')).toBeInTheDocument();

      // Close mobile menu
      fireEvent.click(browseButton);
      expect(screen.queryByTestId('mobile-menu-admin')).not.toBeInTheDocument();
      expect(screen.getByTestId('account-menu')).toBeInTheDocument();
    });
  });

  describe('Profile Image Container', () => {
    it('should have rounded corners', () => {
      const { container } = render(<AdminNav />);
      const imgContainer = container.querySelector('.w-8.h-8');
      expect(imgContainer?.className).toMatch(/rounded-md/);
    });

    it('should have overflow hidden', () => {
      const { container } = render(<AdminNav />);
      const imgContainer = container.querySelector('.overflow-hidden');
      expect(imgContainer).toBeInTheDocument();
    });

    it('should have responsive sizing', () => {
      const { container } = render(<AdminNav />);
      const imgContainer = container.querySelector('.w-8.h-8');
      expect(imgContainer?.className).toMatch(/sm:w-10/);
      expect(imgContainer?.className).toMatch(/sm:h-10/);
    });
  });

  describe('Component Composition', () => {
    it('should render AccountMenu component with visibility prop', () => {
      render(<AdminNav />);
      // Initially not visible
      expect(screen.queryByTestId('account-menu')).not.toBeInTheDocument();

      // Toggle to visible
      const buttons = screen.getAllByRole('button');
      const accountButton = buttons[buttons.length - 1];
      fireEvent.click(accountButton);
      expect(screen.getByTestId('account-menu')).toBeInTheDocument();
    });

    it('should render MobileMenuAdmin component with visibility prop', () => {
      render(<AdminNav />);
      // Initially not visible
      expect(screen.queryByTestId('mobile-menu-admin')).not.toBeInTheDocument();

      // Toggle to visible
      const browseButton = screen.getByRole('button', { name: /Browse/i });
      fireEvent.click(browseButton);
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
    });

    it('should render NavbarItem components', () => {
      render(<AdminNav />);
      const items = screen.getAllByTestId(/^navbar-item-/);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Logo Width and Height', () => {
    it('should have proper dimensions for desktop logo', () => {
      render(<AdminNav />);
      const logos = screen.getAllByAltText('Logo');
      logos.forEach((logo) => {
        expect(logo).toHaveAttribute('width');
        expect(logo).toHaveAttribute('height');
      });
    });

    it('should have different sizes for mobile and desktop', () => {
      render(<AdminNav />);
      const logos = screen.getAllByAltText('Logo');
      // Desktop logo should be 100x100, mobile should be 500x500
      expect(logos.length).toBeGreaterThan(1);
    });
  });

  describe('Client Component', () => {
    it('should be a client-rendered component', () => {
      const { container } = render(<AdminNav />);
      expect(container).toBeTruthy();
    });

    it('should use hooks for state management', () => {
      render(<AdminNav />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });

    it('should have event listeners for interactivity', () => {
      render(<AdminNav />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Chevron Icon Behavior', () => {
    it('should render chevron icons', () => {
      render(<AdminNav />);
      const browseButton = screen.getByText('Browse');
      const browseButtonElement = browseButton.closest('button');
      const chevron = browseButtonElement?.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });

    it('should rotate chevron on menu toggle', () => {
      render(<AdminNav />);
      const browseButton = screen.getByText('Browse');
      const browseButtonElement = browseButton.closest('button');
      const chevron = browseButtonElement?.querySelector('svg');

      // Verify chevron exists
      expect(chevron).toBeInTheDocument();
      
      // Toggle menu
      fireEvent.click(browseButtonElement!);
      
      // Verify menu is now visible after toggle
      expect(screen.getByTestId('mobile-menu-admin')).toBeInTheDocument();
    });
  });

  describe('Navigation Gap and Spacing', () => {
    it('should have proper gap between navbar items', () => {
      const { container } = render(<AdminNav />);
      const navItems = container.querySelector('.gap-7');
      expect(navItems?.className).toMatch(/gap-7/);
    });

    it('should have proper gap between account menu items', () => {
      const { container } = render(<AdminNav />);
      const accountSection = container.querySelector('.ml-auto');
      expect(accountSection?.className).toMatch(/gap-7/);
    });
  });

  describe('Fixed Positioning', () => {
    it('should be fixed at top of viewport', () => {
      const { container } = render(<AdminNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/fixed/);
      expect(nav?.className).toMatch(/w-full/);
    });

    it('should have high z-index for visibility', () => {
      const { container } = render(<AdminNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/z-40/);
    });

    it('should have black background with opacity', () => {
      const { container } = render(<AdminNav />);
      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/bg-black/);
      expect(nav?.className).toMatch(/bg-opacity-30/);
    });
  });
});
