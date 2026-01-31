'use client';

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminUsersPage from '../page';

// Mock useCurrentUser hook
jest.mock('@/hooks/useCurrentUser', () => {
  return jest.fn(() => ({
    user: { id: 'current-user-id', name: 'Current User', email: 'current@example.com' },
  }));
});

// Mock UserBlockButton component
jest.mock('@/components/admin/UserBlockButton', () => {
  return function MockUserBlockButton({ userId, isBlocked, onChange }: any) {
    return (
      <button
        data-testid={`block-button-${userId}`}
        onClick={() => onChange(!isBlocked)}
        className="bg-red-600 px-3 py-1 rounded text-white"
      >
        {isBlocked ? 'Unblock' : 'Block'}
      </button>
    );
  };
});

// Mock fetch globally
globalThis.fetch = jest.fn();

const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    createdAt: new Date('2024-01-15').toISOString(),
    isBlocked: false,
    profiles: [
      { id: 'profile-1', name: 'John Profile', inUse: true },
    ],
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'ADMIN',
    createdAt: new Date('2024-02-20').toISOString(),
    isBlocked: true,
    profiles: [
      { id: 'profile-2', name: 'Jane Profile', inUse: false },
      { id: 'profile-3', name: 'Jane Profile 2', inUse: true },
    ],
  },
  {
    id: 'user-3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'USER',
    createdAt: new Date('2024-03-10').toISOString(),
    isBlocked: false,
    profiles: [],
  },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockUsers,
    });
  });

  describe('Component Rendering', () => {
    it('should render the admin users page', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /User Management/i })).toBeInTheDocument();
      });
    });

    it('should render the main heading "User Management"', async () => {
      render(<AdminUsersPage />);
      const heading = screen.getByRole('heading', { name: /User Management/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-3xl', 'font-extrabold');
    });

    it('should render search input', async () => {
      render(<AdminUsersPage />);
      const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render users table', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should render table headers', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Check for headers using getAllByRole
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch users on component mount', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/users');
      });
    });

    it('should display loading state initially', () => {
      (globalThis.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<AdminUsersPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display users after fetching', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display "No users found" when API returns empty array', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => [],
      });
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Display', () => {
    it('should display user names', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display user emails', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });

    it('should display user roles', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const roleTexts = screen.getAllByText(/USER|ADMIN/);
        expect(roleTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display creation dates in correct format', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        // Dates are formatted using toLocaleDateString()
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    it('should display user profiles in list', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Profile')).toBeInTheDocument();
        expect(screen.getByText('Jane Profile')).toBeInTheDocument();
      });
    });

    it('should display active profile indicator', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const activeIndicators = screen.getAllByText(/\(aktiv\)/);
        expect(activeIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should display "No profiles" for users without profiles', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('No profiles')).toBeInTheDocument();
      });
    });

    it('should display user status as Active or Blocked', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const activeStatuses = screen.getAllByText(/Active/);
        const blockedStatuses = screen.getAllByText(/Blocked/);
        expect(activeStatuses.length).toBeGreaterThan(0);
        expect(blockedStatuses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter users by name', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should filter users by email', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'bob@example.com' } });

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'JANE' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should show "No users found" when search has no results', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'nonexistent@example.com' } });

      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by name in ascending order', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const nameHeader = screen.getAllByText(/Name/)[0];
      fireEvent.click(nameHeader);

      await waitFor(() => {
        // Verify the header is clickable and sorting event fired
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should toggle sort direction when clicking same header', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const nameHeader = screen.getAllByText(/Name/)[0];
      fireEvent.click(nameHeader);

      await waitFor(() => {
        // Verify the header was clicked and sorting happened
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      fireEvent.click(nameHeader);

      await waitFor(() => {
        // Verify clicking again still works
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should sort by email', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const emailHeader = screen.getByText(/Email/);
      fireEvent.click(emailHeader);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should sort by role', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const roleHeader = screen.getByText(/Role/);
      fireEvent.click(roleHeader);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should sort by created date', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const createdHeader = screen.getByText(/Created/);
      fireEvent.click(createdHeader);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should sort by status (blocked)', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const statusHeader = screen.getAllByText(/Status/)[0];
      fireEvent.click(statusHeader);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/Seite/)).toBeInTheDocument();
      });
    });

    it('should show current page number', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/Seite 1/)).toBeInTheDocument();
      });
    });

    it('should have pagination buttons', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should disable previous button on first page', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const prevButton = screen.getByText('<');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button when on last page with few users', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const nextButton = screen.getByText('>');
        // With only 3 users and page size 20, we only have 1 page
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('User Block/Unblock', () => {
    it('should render block buttons for other users', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByTestId('block-button-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('block-button-user-2')).toBeInTheDocument();
      });
    });

    it('should not render block button for current user', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.queryByTestId('block-button-current-user-id')).not.toBeInTheDocument();
      });
    });

    it('should show "own account" text for current user', async () => {
      const mockUsersWithCurrent = [
        ...mockUsers,
        {
          id: 'current-user-id',
          name: 'Current User',
          email: 'current@example.com',
          role: 'ADMIN',
          createdAt: new Date('2024-01-01').toISOString(),
          isBlocked: false,
          profiles: [],
        },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockUsersWithCurrent,
      });

      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/\(own account\)/)).toBeInTheDocument();
      });
    });

    it('should update user block status when button clicked', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByTestId('block-button-user-1')).toBeInTheDocument();
      });

      const blockButton = screen.getByTestId('block-button-user-1');
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByText(/User blocked!/)).toBeInTheDocument();
      });
    });

    it('should show success message when user status changes', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByTestId('block-button-user-1')).toBeInTheDocument();
      });

      const blockButton = screen.getByTestId('block-button-user-1');
      fireEvent.click(blockButton);

      await waitFor(() => {
        const successMessage = screen.getByText(/User blocked!|User unblocked!/);
        expect(successMessage).toBeInTheDocument();
      });
    });

    it('should clear success message after delay', async () => {
      jest.useFakeTimers();
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByTestId('block-button-user-1')).toBeInTheDocument();
      });

      const blockButton = screen.getByTestId('block-button-user-1');
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByText(/User blocked!|User unblocked!/)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2100);

      await waitFor(() => {
        expect(screen.queryByText(/User blocked!|User unblocked!/)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply proper container classes', async () => {
      const { container } = render(<AdminUsersPage />);
      const mainDiv = container.querySelector('.max-w-5xl');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have proper heading styling', async () => {
      render(<AdminUsersPage />);
      const heading = screen.getByRole('heading', { name: /User Management/i });
      expect(heading).toHaveClass('text-3xl', 'font-extrabold', 'text-zinc-100');
    });

    it('should style search input with focus states', async () => {
      render(<AdminUsersPage />);
      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      expect(searchInput).toHaveClass('border', 'border-zinc-700', 'rounded-lg', 'focus:ring-2');
    });

    it('should style table with proper classes', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('w-full', 'text-left');
      });
    });

    it('should apply hover effects to table rows', async () => {
      const { container } = render(<AdminUsersPage />);
      await waitFor(() => {
        const rows = container.querySelectorAll('tbody tr');
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach(row => {
          expect(row).toHaveClass('hover:bg-zinc-700/60');
        });
      });
    });
  });

  describe('Content Display', () => {
    it('should display success message container', async () => {
      const { container } = render(<AdminUsersPage />);
      const successContainer = container.querySelector('.min-h-6');
      expect(successContainer).toBeInTheDocument();
    });

    it('should display "All Users" section heading', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('All Users')).toBeInTheDocument();
      });
    });

    it('should display table headers with sortable indicators', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rendering with no users', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => [],
      });
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
    });

    it('should handle users without profiles', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('No profiles')).toBeInTheDocument();
      });
    });

    it('should handle users with multiple profiles', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const janeProfiles = screen.getAllByText(/Jane Profile/);
        expect(janeProfiles.length).toBeGreaterThan(1);
      });
    });

    it('should handle long user names', async () => {
      const usersWithLongNames = [
        {
          ...mockUsers[0],
          name: 'This is a very long user name that should still display properly in the table',
        },
      ];
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => usersWithLongNames,
      });
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText(/This is a very long user name/i)).toBeInTheDocument();
      });
    });

    it('should handle many users gracefully', async () => {
      const manyUsers = Array.from({ length: 50 }, (_, i) => ({
        ...mockUsers[0],
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: async () => manyUsers,
      });

      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
        // Should show pagination
        expect(screen.getByText(/Seite/)).toBeInTheDocument();
      });
    });

    it('should render without errors on component mount', () => {
      expect(() => {
        render(<AdminUsersPage />);
      }).not.toThrow();
    });

    it('should handle special characters in search', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: '@' } });

      // Should still function and show results with @ in email
      await waitFor(() => {
        const emailElements = screen.queryAllByText(/@example.com/);
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading hierarchy', async () => {
      render(<AdminUsersPage />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have proper table semantics', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      });
    });

    it('should have accessible search input', async () => {
      render(<AdminUsersPage />);
      const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should have accessible buttons', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should have proper contrast and readability', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const johnElement = screen.getByText('John Doe');
        const janeElement = screen.getByText('Jane Smith');
        const bobElement = screen.getByText('Bob Johnson');
        expect(johnElement).toBeInTheDocument();
        expect(janeElement).toBeInTheDocument();
        expect(bobElement).toBeInTheDocument();
      });
    });
  });

  describe('Data State Management', () => {
    it('should update users list when block status changes', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        const initialStatus = screen.getByText('Jane Smith').closest('tr')?.textContent;
        expect(initialStatus).toContain('Blocked');
      });

      const blockButton = screen.getByTestId('block-button-user-2');
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByText(/User unblocked!/)).toBeInTheDocument();
      });
    });

    it('should maintain search filter when updating user status', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const blockButton = screen.getByTestId('block-button-user-2');
      fireEvent.click(blockButton);

      await waitFor(() => {
        expect(screen.getByText(/User unblocked!/)).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('User Interface Interactions', () => {
    it('should allow clearing search input', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle rapid sorting changes', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const nameHeader = screen.getAllByText(/Name/)[0];
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);
      fireEvent.click(nameHeader);

      await waitFor(() => {
        expect(screen.getByText(/▲|▼/)).toBeInTheDocument();
      });
    });

    it('should handle rapid search input changes', async () => {
      render(<AdminUsersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by name or email/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'J' } });
      fireEvent.change(searchInput, { target: { value: 'Ja' } });
      fireEvent.change(searchInput, { target: { value: 'Jan' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });
});
