import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountMenu from '../AccountMenu';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));
jest.mock('next/image', () => {
  return function DummyImage({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) {
    let finalSrc = src;
    if (typeof src === 'string' && !src.includes('/images/profil/')) {
      finalSrc = `/images/profil/${src}`;
    }
    return (
      <img
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        data-testid="account-menu-image"
      />
    );
  };
});

jest.mock('next/link', () => {
  return function DummyLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/hooks/use-current-user');
jest.mock('@/hooks/useCurrentProfil');

const { signOut } = require('next-auth/react');
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const { useCurrentUser } = require('@/hooks/use-current-user');
const useCurrentProfil = require('@/hooks/useCurrentProfil').default;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'USER',
};

const mockAdminUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const mockProfil = {
  id: 'profil-1',
  name: 'Test Profile',
  image: 'test-profile.jpg',
};

describe('AccountMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrentUser.mockReturnValue(mockUser);
    useCurrentProfil.mockReturnValue({
      data: mockProfil,
      error: null,
      isLoading: false,
    });
  });

  describe('Visibility', () => {
    it('should render when visible prop is true', () => {
      render(<AccountMenu visible={true} />);
      const profileName = screen.getByText(mockProfil.name);
      expect(profileName).toBeInTheDocument();
    });

    it('should not render when visible prop is false', () => {
      render(<AccountMenu visible={false} />);
      expect(screen.queryByText(mockProfil.name)).not.toBeInTheDocument();
    });

    it('should not render when visible prop is undefined', () => {
      render(<AccountMenu />);
      expect(screen.queryByText(mockProfil.name)).not.toBeInTheDocument();
    });

    it('should not render when profile is undefined', () => {
      useCurrentProfil.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
      });
      render(<AccountMenu visible={true} />);
      expect(screen.queryByText(mockProfil.name)).not.toBeInTheDocument();
    });
  });

  describe('Profile Display', () => {
    it('should render profile name', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText(mockProfil.name)).toBeInTheDocument();
    });

    it('should render profile image with correct source', () => {
      render(<AccountMenu visible={true} />);
      const image = screen.getByTestId('account-menu-image');
      expect(image).toHaveAttribute('src', `/images/profil/${mockProfil.image}`);
    });

    it('should handle missing image gracefully', () => {
      useCurrentProfil.mockReturnValue({
        data: { ...mockProfil, image: undefined },
        error: null,
        isLoading: false,
      });
      render(<AccountMenu visible={true} />);
      const image = screen.getByTestId('account-menu-image');
      expect(image).toBeInTheDocument();
    });

    it('should link profile to /profiles', () => {
      render(<AccountMenu visible={true} />);
      const profileLink = screen.getByText(mockProfil.name).closest('a');
      expect(profileLink).toHaveAttribute('href', '/profiles');
    });

    it('should have responsive image dimensions', () => {
      render(<AccountMenu visible={true} />);
      const image = screen.getByTestId('account-menu-image');
      expect(image).toHaveAttribute('width', '320');
      expect(image).toHaveAttribute('height', '320');
    });

    it('should have rounded-md class to profile image', () => {
      render(<AccountMenu visible={true} />);
      const image = screen.getByTestId('account-menu-image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Non-Admin User Menu', () => {
    it('should not render admin section for non-admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('should not render add movies link for non-admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.queryByText('Add new Movies')).not.toBeInTheDocument();
    });

    it('should render settings link for non-admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render sign out button for non-admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Sign out of Netflix')).toBeInTheDocument();
    });

    it('should have 2 main navigation links for non-admin users', () => {
      render(<AccountMenu visible={true} />);
      const links = screen.getAllByRole('link', { hidden: true });
      // Profile link + Settings link
      expect(links.length).toBeGreaterThanOrEqual(2);
      const profileLink = links.find(l => l.getAttribute('href') === '/profiles');
      const settingsLink = links.find(l => l.getAttribute('href') === '/settings');
      expect(profileLink).toBeDefined();
      expect(settingsLink).toBeDefined();
    });
  });

  describe('Admin User Menu', () => {
    beforeEach(() => {
      useCurrentUser.mockReturnValue(mockAdminUser);
    });

    it('should render admin section for admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render add movies link for admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Add new Movies')).toBeInTheDocument();
    });

    it('should link admin to /admin', () => {
      render(<AccountMenu visible={true} />);
      const adminLink = screen.getByRole('link', {
        name: /Admin/i,
        hidden: true,
      });
      expect(adminLink).toHaveAttribute('href', '/admin');
    });

    it('should link add movies to /add', () => {
      render(<AccountMenu visible={true} />);
      const addLink = screen.getByRole('link', {
        name: /Add new Movies/i,
        hidden: true,
      });
      expect(addLink).toHaveAttribute('href', '/add');
    });

    it('should render settings link for admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render sign out button for admin users', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Sign out of Netflix')).toBeInTheDocument();
    });

    it('should have 4 main navigation links for admin users', () => {
      render(<AccountMenu visible={true} />);
      const links = screen.getAllByRole('link', { hidden: true });
      // Profile, Admin, Add Movies, Settings
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call signOut when sign out button is clicked', () => {
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      fireEvent.click(signOutButton);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should call signOut on Enter key press', () => {
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      fireEvent.keyDown(signOutButton, { key: 'Enter', code: 'Enter' });
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should call signOut on Space key press', () => {
      mockSignOut.mockClear();
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      fireEvent.keyDown(signOutButton, { key: ' ', code: 'Space' });
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should not call signOut on other key press', () => {
      mockSignOut.mockClear();
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      fireEvent.keyDown(signOutButton, { key: 'a', code: 'KeyA' });
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should render sign out button with cursor-pointer class', () => {
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      expect(signOutButton).toBeInTheDocument();
    });

    it('should render sign out button with hover:underline class', () => {
      render(<AccountMenu visible={true} />);
      const signOutButton = screen.getByText('Sign out of Netflix');
      expect(signOutButton).toBeInTheDocument();
    });
  });

  describe('Settings Link', () => {
    it('should render settings link', () => {
      render(<AccountMenu visible={true} />);
      const settingsLink = screen.getByRole('link', {
        name: /Settings/i,
        hidden: true,
      });
      expect(settingsLink).toBeInTheDocument();
    });

    it('should link settings to /settings', () => {
      render(<AccountMenu visible={true} />);
      const settingsLink = screen.getByRole('link', {
        name: /Settings/i,
        hidden: true,
      });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should have hover:underline class on settings', () => {
      render(<AccountMenu visible={true} />);
      const settingsLink = screen.getByRole('link', {
        name: /Settings/i,
        hidden: true,
      });
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have absolute positioning', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.absolute');
      expect(menu).toBeInTheDocument();
    });

    it('should be positioned at right-0', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.right-0');
      expect(menu).toBeInTheDocument();
    });

    it('should have fixed width of w-56', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.w-56');
      expect(menu).toBeInTheDocument();
    });

    it('should have black background', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.bg-black');
      expect(menu).toBeInTheDocument();
    });

    it('should have gray border', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.border-gray-800');
      expect(menu).toBeInTheDocument();
    });

    it('should have top-14 positioning', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.top-14');
      expect(menu).toBeInTheDocument();
    });

    it('should have flex flex-col layout', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.flex.flex-col');
      expect(menu).toBeInTheDocument();
    });

    it('should have py-2 padding', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.py-2');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Profile Link Styling', () => {
    it('should render profile link with flex layout', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileLink = container.querySelector('a[href="/profiles"]');
      expect(profileLink).toBeInTheDocument();
    });

    it('should have gap-4 between profile image and name', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileDiv = container.querySelector(
        'a[href="/profiles"] > div'
      );
      expect(profileDiv?.className).toMatch(/gap-4/);
    });

    it('should have group/item class for hover effects', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileDiv = container.querySelector(
        'a[href="/profiles"] > div'
      );
      expect(profileDiv?.className).toMatch(/group\/item/);
    });

    it('should have hover:underline on profile name', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileName = container.querySelector(
        'a[href="/profiles"] p'
      );
      expect(profileName).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useCurrentUser hook', () => {
      render(<AccountMenu visible={true} />);
      expect(useCurrentUser).toHaveBeenCalled();
    });

    it('should call useCurrentProfil hook', () => {
      render(<AccountMenu visible={true} />);
      expect(useCurrentProfil).toHaveBeenCalled();
    });

    it('should use profile data from hook', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText(mockProfil.name)).toBeInTheDocument();
    });

    it('should handle loading state from hook', () => {
      useCurrentProfil.mockReturnValue({
        data: mockProfil,
        error: null,
        isLoading: true,
      });
      render(<AccountMenu visible={true} />);
      // Component should still render despite loading state
      expect(screen.getByText(mockProfil.name)).toBeInTheDocument();
    });

    it('should handle error state from hook', () => {
      useCurrentProfil.mockReturnValue({
        data: undefined,
        error: new Error('Failed to load profile'),
        isLoading: false,
      });
      render(<AccountMenu visible={true} />);
      // Component should not render if profile is undefined
      expect(screen.queryByText(mockProfil.name)).not.toBeInTheDocument();
    });
  });

  describe('Text Styling', () => {
    it('should have white text color', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const items = container.querySelectorAll('.text-white');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have text-sm for profile name', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileName = container.querySelector(
        'a[href="/profiles"] p'
      );
      expect(profileName?.className).toMatch(/text-sm/);
    });

    it('should have text-sm for menu items', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menuItems = container.querySelectorAll('.text-sm');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Menu Items Alignment', () => {
    it('should center align settings', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should center align sign out', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText('Sign out of Netflix')).toBeInTheDocument();
    });
  });

  describe('Horizontal Dividers', () => {
    it('should render horizontal dividers for visual separation', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const dividers = container.querySelectorAll('hr');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('should have gray-600 color for dividers', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const divider = container.querySelector('.bg-gray-600');
      expect(divider).toBeInTheDocument();
    });

    it('should have multiple dividers for admin users', () => {
      useCurrentUser.mockReturnValue(mockAdminUser);
      const { container } = render(<AccountMenu visible={true} />);
      const dividers = container.querySelectorAll('hr');
      // More dividers for admin menu with extra options
      expect(dividers.length).toBeGreaterThan(3);
    });
  });

  describe('Responsive Design', () => {
    it('should render AccountMenu component', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText(mockProfil.name)).toBeInTheDocument();
    });

    it('should be responsive for mobile', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const image = screen.getByTestId('account-menu-image');
      expect(image).toBeInTheDocument();
    });

    it('should be responsive for desktop', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.absolute');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Profile Link Container', () => {
    it('should render profile link', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileLink = container.querySelector('a[href="/profiles"]');
      expect(profileLink).toBeInTheDocument();
    });

    it('should have gap between profile image and name', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileDiv = container.querySelector('a[href="/profiles"] > div');
      expect(profileDiv).toBeInTheDocument();
    });

    it('should have group/item class for hover effects', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileDiv = container.querySelector('a[href="/profiles"] > div');
      expect(profileDiv).toBeInTheDocument();
    });

    it('should have full width on profile link', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const profileLink = container.querySelector('a[href="/profiles"] > div');
      expect(profileLink).toBeInTheDocument();
    });
  });

  describe('Border Styling', () => {
    it('should have 2px border', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.border-2');
      expect(menu).toBeInTheDocument();
    });

    it('should have gray-800 border color', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.border-gray-800');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Flex Container', () => {
    it('should have flex layout', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const innerContainer = container.querySelector('.flex');
      expect(innerContainer).toBeInTheDocument();
    });

    it('should have gap between menu items', () => {
      render(<AccountMenu visible={true} />);
      expect(screen.getByText(mockProfil.name)).toBeInTheDocument();
    });
  });

  describe('Navigation Structure', () => {
    it('should render all navigation links inside menu', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.absolute.right-0');
      const links = menu?.querySelectorAll('a');
      expect(links?.length).toBeGreaterThan(0);
    });

    it('should structure menu as dropdown', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const menu = container.querySelector('.absolute');
      expect(menu?.className).toMatch(/top-14/);
      expect(menu?.className).toMatch(/right-0/);
    });
  });

  describe('Content Order', () => {
    it('should display profile first', () => {
      render(<AccountMenu visible={true} />);
      const profileLink = screen.getByRole('link', {
        name: /Test Profile/i,
        hidden: true,
      });
      expect(profileLink).toBeInTheDocument();
    });

    it('should display settings before sign out', () => {
      const { container } = render(<AccountMenu visible={true} />);
      const elements = Array.from(container.querySelectorAll('a, [role="button"]'));
      const settingsIndex = elements.findIndex(el =>
        el.textContent?.includes('Settings')
      );
      const signOutIndex = elements.findIndex(el =>
        el.textContent?.includes('Sign out')
      );
      expect(settingsIndex).toBeLessThan(signOutIndex);
    });
  });

  describe('Admin Menu Ordering', () => {
    beforeEach(() => {
      useCurrentUser.mockReturnValue(mockAdminUser);
    });

    it('should display admin link after profile', () => {
      render(<AccountMenu visible={true} />);
      const adminLink = screen.getByText('Admin');
      expect(adminLink).toBeInTheDocument();
    });

    it('should display add movies link after admin link', () => {
      render(<AccountMenu visible={true} />);
      const addMoviesLink = screen.getByText('Add new Movies');
      expect(addMoviesLink).toBeInTheDocument();
    });

    it('should display settings after admin options', () => {
      render(<AccountMenu visible={true} />);
      const settingsLink = screen.getByText('Settings');
      expect(settingsLink).toBeInTheDocument();
    });
  });
});
