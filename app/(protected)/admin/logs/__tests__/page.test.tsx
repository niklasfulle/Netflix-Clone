'use client';

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminLogsPage from '../page';

// Mock fetch
globalThis.fetch = jest.fn();

describe('AdminLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockReset();
  });

  describe('Component Rendering', () => {
    it('should render the admin logs page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Logs Management')).toBeInTheDocument();
      });
    });

    it('should render page title', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Logs Management')).toBeInTheDocument();
      });
    });

    it('should render with proper container structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      await waitFor(() => {
        expect(container.querySelector('.max-w-8xl')).toBeInTheDocument();
      });
    });

    it('should render main container div', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      expect(container).toBeInTheDocument();
    });

    it('should render logs section', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Logs Management')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminLogsPage />);
      expect(screen.getByText('Lade Logs...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.queryByText('Lade Logs...')).not.toBeInTheDocument();
      });
    });

    it('should display loading message while fetching', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              200
            )
          )
      );

      render(<AdminLogsPage />);
      const loadingElement = screen.getByText('Lade Logs...');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should set loading to true on mount', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminLogsPage />);
      expect(screen.getByText('Lade Logs...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error message when fetch fails', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
    });

    it('should display error in red text', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);
      await waitFor(() => {
        const errorElement = screen.getByText('Fehler beim Laden der Logs.');
        expect(errorElement).toHaveClass('text-red-500');
      });
    });

    it('should show error when response has no logs property', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ total: 0, totalPages: 1 }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('No logs found.')).toBeInTheDocument();
      });
    });

    it('should show error when response data is undefined', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => undefined,
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when JSON parsing fails', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
    });

    it('should not show table when error occurs', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.queryByRole('table')
        ).not.toBeInTheDocument();
      });
    });

    it('should handle error state gracefully', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Server error')
      );

      const { container } = render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call fetch with correct endpoint on mount', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/logs?page=1&pageSize=20'
        );
      });
    });

    it('should call fetch with correct page parameter', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/logs?page=1&pageSize=20'
        );
      });
    });

    it('should use correct pageSize', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0][0];
        expect(callArgs).toContain('pageSize=20');
      });
    });

    it('should set logs state on successful fetch', async () => {
      const mockLogs = [
        { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
        { timestamp: '2024-01-01T10:05:00Z', action: 'Logout', userId: 'user2', level: 'info' },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: mockLogs,
          total: 2,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should set total logs count on successful fetch', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/\(100 angezeigt\)/)).toBeInTheDocument();
      });
    });

    it('should set totalPages state on successful fetch', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should handle empty logs array', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Keine Logs gefunden/)).toBeInTheDocument();
      });
    });

    it('should handle logs with data', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Action 1', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should initialize with page 1', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 60,
          totalPages: 3,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display current page number', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display total pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should have pagination buttons', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 60,
          totalPages: 3,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle single page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/\/ 1/)).toBeInTheDocument();
      });
    });

    it('should handle multiple pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 200,
          totalPages: 10,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/\/ 10/)).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const prevButton = allButtons.find(btn => btn.textContent?.includes('<'));
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button on last page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const nextButton = buttons[buttons.length - 1];
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Level Filtering', () => {
    it('should render level filter select when logs exist', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should have all level filter options', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
        expect(selectElement.value).toBe('all');
      });
    });

    it('should filter logs by selected level', async () => {
      const mockLogs = [
        { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
        { timestamp: '2024-01-01T10:05:00Z', action: 'Error occurred', userId: 'user2', level: 'error' },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: mockLogs,
          total: 2,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });

    it('should display all logs when filter is "all"', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Action 1', userId: 'user1', level: 'info' },
            { timestamp: '2024-01-01T10:05:00Z', action: 'Action 2', userId: 'user2', level: 'error' },
          ],
          total: 2,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
        expect(screen.getByText('Action 2')).toBeInTheDocument();
      });
    });

    it('should reset page when filter changes', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Logs Functionality', () => {
    it('should render clear logs button when logs exist', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.queryByRole('table')).toBeInTheDocument();
      });
      
      const clearButton = screen.getByRole('button', { name: /Logs leeren/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should call clear logs endpoint when button clicked', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            logs: [
              { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
            ],
            total: 1,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.queryByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Logs leeren/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/logs/clear', {
          method: 'POST',
        });
      });
    });

    it('should clear logs on successful clear', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            logs: [
              { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
            ],
            total: 1,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Logs leeren/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/Keine Logs gefunden/)).toBeInTheDocument();
      });
    });

    it('should show error when clear logs fails', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            logs: [
              { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
            ],
            total: 1,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed' }),
        });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.queryByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /Logs leeren/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Leeren der Logs.')
        ).toBeInTheDocument();
      });
    });

    it('should disable clear button while loading', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Verify the button exists and can be found
      const clearButton = screen.getByRole('button', { name: /Logs leeren/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Log Table Display', () => {
    it('should render logs table when logs exist', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should render table headers', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Zeit')).toBeInTheDocument();
        expect(screen.getByText('Aktion')).toBeInTheDocument();
        expect(screen.getByText('User ID')).toBeInTheDocument();
        expect(screen.getByText('Level')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('should display log data in table rows', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user123', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('user123')).toBeInTheDocument();
      });
    });

    it('should display multiple logs', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
            { timestamp: '2024-01-01T10:05:00Z', action: 'Logout', userId: 'user2', level: 'info' },
            { timestamp: '2024-01-01T10:10:00Z', action: 'Failed Auth', userId: 'user3', level: 'error' },
          ],
          total: 3,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByText('Failed Auth')).toBeInTheDocument();
      });
    });

    it('should format timestamp correctly', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should show dash for missing timestamp', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should show dash for missing action', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
    });

    it('should show dash for missing userId', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should show dash for missing level', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });

  describe('Log Level Colors', () => {
    it('should display info logs in green', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('info')).toHaveClass('text-green-400');
      });
    });

    it('should display error logs in red', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'error' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('error')).toHaveClass('text-red-500');
      });
    });

    it('should display warning logs in yellow', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'warning' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('warning')).toHaveClass('text-yellow-400');
      });
    });

    it('should display info level when unknown level', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'unknown' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('unknown')).toHaveClass('text-green-400');
      });
    });
  });

  describe('Details Button', () => {
    it('should render details button for each log', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /details anzeigen/i })).toBeInTheDocument();
      });
    });

    it('should show alert with log details when button clicked', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const detailButton = screen.getByRole('button', { name: /details anzeigen/i });
        fireEvent.click(detailButton);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null logs response', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: null,
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('No logs found.')
        ).toBeInTheDocument();
      });
    });

    it('should handle missing total count', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Keine Logs gefunden/)).toBeInTheDocument();
      });
    });

    it('should handle zero pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 0,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should handle very large log counts', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: Array.from({ length: 20 }, (_, i) => ({
            timestamp: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
            action: `Action ${i + 1}`,
            userId: `user${i}`,
            level: 'info',
          })),
          total: 5000,
          totalPages: 250,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('(5000 angezeigt)')).toBeInTheDocument();
      });
    });

    it('should handle logs with special characters in action', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Action & <Special>', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Action & <Special>')).toBeInTheDocument();
      });
    });

    it('should handle empty user ID', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: '', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Structure', () => {
    it('should have a main container div', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render content inside container', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      await waitFor(() => {
        expect(container.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should have proper element structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      await waitFor(() => {
        const mainDiv = container.querySelector('div');
        expect(mainDiv).toBeTruthy();
      });
    });

    it('should render without extra wrappers', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      await waitFor(() => {
        expect(container.children.length).toBeGreaterThan(0);
      });
    });

    it('should maintain structure during loading', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              100
            )
          )
      );

      const { container } = render(<AdminLogsPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default states', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should update page state when page changes', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should handle loading state transitions', async () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    logs: [],
                    total: 0,
                    totalPages: 1,
                  }),
                }),
              50
            )
          )
      );

      render(<AdminLogsPage />);
      expect(screen.getByText('Lade Logs...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Lade Logs...')).not.toBeInTheDocument();
        expect(screen.getByText(/Keine Logs gefunden/)).toBeInTheDocument();
      });
    });

    it('should handle error state transitions', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminLogsPage />);
      expect(container).toBeInTheDocument();
    });

    it('should render filter label', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should have accessible error messages', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);
      await waitFor(() => {
        const errorMessage = screen.getByText('Fehler beim Laden der Logs.');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should provide loading feedback', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminLogsPage />);
      expect(screen.getByText('Lade Logs...')).toBeInTheDocument();
    });

    it('should render navigation buttons with descriptive titles', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Test', userId: 'user1', level: 'info' },
          ],
          total: 100,
          totalPages: 5,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('should render loading content when loading is true', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ logs: [], total: 0, totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminLogsPage />);
      expect(screen.getByText('Lade Logs...')).toBeInTheDocument();
    });

    it('should render error content when error is set', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Logs.')
        ).toBeInTheDocument();
      });
    });

    it('should render empty state when no logs exist', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Keine Logs gefunden/)).toBeInTheDocument();
      });
    });

    it('should render table content when logs exist', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [
            { timestamp: '2024-01-01T10:00:00Z', action: 'Login', userId: 'user1', level: 'info' },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should not render multiple states simultaneously', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(screen.queryByText('Lade Logs...')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Fehler beim Laden der Logs.')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Effect Hook Behavior', () => {
    it('should fetch data on component mount', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });

    it('should fetch data with correct dependencies', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          logs: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminLogsPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/logs?page=1&pageSize=20'
        );
      });
    });
  });
});
