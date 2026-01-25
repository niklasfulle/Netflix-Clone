import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock icons first before importing component
jest.mock('react-icons/fa', () => ({
  FaCheck: ({ className, size }: any) => (
    <svg data-testid="check-icon" data-className={className} data-size={size}>
      Check
    </svg>
  ),
  FaPlus: ({ className, size }: any) => (
    <svg data-testid="plus-icon" data-className={className} data-size={size}>
      Plus
    </svg>
  ),
}));

// Mock hooks before importing component
jest.mock('@/hooks/useCurrentProfil');
jest.mock('@/hooks/useFavorites');

// Mock actions before importing component
jest.mock('@/actions/favorite/add', () => ({
  add: jest.fn(),
}));
jest.mock('@/actions/favorite/remove', () => ({
  remove: jest.fn(),
}));

import FavoriteButton from '../FavoriteButton';
import * as favoriteActions from '@/actions/favorite/add';
import * as removeActions from '@/actions/favorite/remove';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useFavorites from '@/hooks/useFavorites';

const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<typeof useCurrentProfil>;
const mockUseFavorites = useFavorites as jest.MockedFunction<typeof useFavorites>;
const mockAdd = favoriteActions.add as jest.MockedFunction<typeof favoriteActions.add>;
const mockRemove = removeActions.remove as jest.MockedFunction<typeof removeActions.remove>;

describe('FavoriteButton', () => {
  const defaultMockData = {
    data: {
      id: 'profil-1',
      favoriteIds: [],
      name: 'Test Profil',
    },
    mutate: jest.fn(),
  };

  const defaultMockFavorites = {
    mutate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentProfil.mockReturnValue(defaultMockData as any);
    mockUseFavorites.mockReturnValue(defaultMockFavorites as any);
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render a button element', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with proper className structure', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/flex/);
      expect(button.className).toMatch(/items-center/);
      expect(button.className).toMatch(/justify-center/);
      expect(button.className).toMatch(/h-10/);
      expect(button.className).toMatch(/w-10/);
      expect(button.className).toMatch(/border-2/);
      expect(button.className).toMatch(/border-white/);
      expect(button.className).toMatch(/rounded-full/);
      expect(button.className).toMatch(/cursor-pointer/);
      expect(button.className).toMatch(/transition/);
      expect(button.className).toMatch(/group\/item/);
      expect(button.className).toMatch(/hover:border-neutral-300/);
    });

    it('should have lg:p-1 class for large screens', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/lg:p-1/);
    });
  });

  describe('Icon Display', () => {
    it('should display plus icon when not favorite', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const plusIcon = screen.getByTestId('plus-icon');
      expect(plusIcon).toBeInTheDocument();
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('should display check icon when is favorite', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const checkIcon = screen.getByTestId('check-icon');
      expect(checkIcon).toBeInTheDocument();
      expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument();
    });

    it('should toggle icon when favorite status changes', () => {
      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();

      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      rerender(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument();
    });

    it('should render icon with text-white class', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const icon = screen.getByTestId('plus-icon');
      expect(icon.getAttribute('data-className')).toMatch(/text-white/);
    });

    it('should render icon with size 20', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const icon = screen.getByTestId('plus-icon');
      expect(icon.getAttribute('data-size')).toBe('20');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for add to favorites', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button', { name: /Add to favorites/ });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-label for remove from favorites', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button', { name: /Remove from favorites/ });
      expect(button).toBeInTheDocument();
    });

    it('should update aria-label when favorite status changes', () => {
      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByRole('button', { name: /Add to favorites/ })).toBeInTheDocument();

      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      rerender(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByRole('button', { name: /Remove from favorites/ })).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should accept movieId prop', () => {
      render(<FavoriteButton movieId="movie-123" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should work with different movieIds', () => {
      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<FavoriteButton movieId="movie-2" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call useFavorites with correct movieId', () => {
      render(<FavoriteButton movieId="movie-abc" />);
      expect(mockUseFavorites).toHaveBeenCalledWith('movie-abc');
    });

    it('should call useCurrentProfil', () => {
      render(<FavoriteButton movieId="movie-1" />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });
  });

  describe('Favorite Status Detection', () => {
    it('should detect movie as not favorite when empty list', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should detect movie as not favorite when movieId not in list', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-2', 'movie-3'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should detect movie as favorite when movieId in list', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should detect movie as favorite when movieId in long list', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: {
          ...defaultMockData.data,
          favoriteIds: ['movie-1', 'movie-2', 'movie-3', 'movie-4', 'movie-5'],
        },
      } as any);

      render(<FavoriteButton movieId="movie-3" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should handle undefined favoriteIds', () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: undefined },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should handle null profil data', () => {
      mockUseCurrentProfil.mockReturnValue({
        data: null,
        mutate: jest.fn(),
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });
  });

  describe('Click Handler - Add to Favorites', () => {
    it('should call add action when adding favorite', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({ movieId: 'movie-1' });
      });
    });

    it('should update profil with optimistic update when adding', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: [], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            favoriteIds: ['movie-1'],
          }),
          false
        );
      });
    });

    it('should call mutateFavorites when adding', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockFavorites.mutate).toHaveBeenCalled();
      });
    });

    it('should add movieId to favoriteIds array', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-2'], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            favoriteIds: ['movie-2', 'movie-1'],
          }),
          false
        );
      });
    });

    it('should not duplicate movieId when adding', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1', 'movie-2'], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      // Movie is already favorite, so clicking will remove it
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith({ movieId: 'movie-1' });
      });
    });
  });

  describe('Click Handler - Remove from Favorites', () => {
    it('should call remove action when removing favorite', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith({ movieId: 'movie-1' });
      });
    });

    it('should update profil with optimistic update when removing', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1'], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            favoriteIds: [],
          }),
          false
        );
      });
    });

    it('should call mutateFavorites when removing', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockFavorites.mutate).toHaveBeenCalled();
      });
    });

    it('should remove movieId from favoriteIds array', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1', 'movie-2'], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            favoriteIds: ['movie-2'],
          }),
          false
        );
      });
    });

    it('should remove only target movieId from favorites', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1', 'movie-2', 'movie-3'], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-2" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            favoriteIds: ['movie-1', 'movie-3'],
          }),
          false
        );
      });
    });
  });

  describe('Event Handling', () => {
    it('should stop event propagation on click', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      const mockEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mockEvent, 'stopPropagation');

      button.dispatchEvent(mockEvent);

      await waitFor(() => {
        expect(stopPropagationSpy).toHaveBeenCalled();
      });
    });

    it('should handle click without error when profil is loading', async () => {
      mockUseCurrentProfil.mockReturnValue({
        data: undefined,
        mutate: jest.fn(),
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('should handle multiple rapid clicks', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAdd.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Styling and Styling Classes', () => {
    it('should have flex container styling', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/flex/);
      expect(button.className).toMatch(/items-center/);
      expect(button.className).toMatch(/justify-center/);
    });

    it('should have size constraints', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/h-10/);
      expect(button.className).toMatch(/w-10/);
    });

    it('should have border styling', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/border-2/);
      expect(button.className).toMatch(/border-white/);
    });

    it('should have circular appearance', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/rounded-full/);
    });

    it('should have cursor pointer', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/cursor-pointer/);
    });

    it('should have hover state', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/hover:border-neutral-300/);
    });

    it('should have transition effect', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/transition/);
    });

    it('should have group item class for nested styling', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/group\/item/);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete toggle flow', async () => {
      const mutate = jest.fn();
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: [], name: 'Test' },
        mutate,
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      // Add to favorites
      fireEvent.click(button);
      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith({ movieId: 'movie-1' });
      });

      // Verify optimistic update called
      expect(mutate).toHaveBeenCalled();
    });

    it('should handle hook updates correctly', async () => {
      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();

      rerender(<FavoriteButton movieId="movie-1" />);
      expect(mockUseCurrentProfil.mock.calls.length).toBeGreaterThan(1);
    });

    it('should handle profil data changes', async () => {
      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();

      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1'], name: 'Test' },
        mutate: jest.fn(),
      } as any);

      rerender(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty movieId', () => {
      render(<FavoriteButton movieId="" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle very long movieId', () => {
      const longId = 'a'.repeat(1000);
      render(<FavoriteButton movieId={longId} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle special characters in movieId', () => {
      render(<FavoriteButton movieId="movie-!@#$%^&*()" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle very large favoriteIds array', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => `movie-${i}`);
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: largeArray, name: 'Test' },
        mutate: jest.fn(),
      } as any);

      render(<FavoriteButton movieId="movie-5000" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should handle case-sensitive movieId matching', () => {
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['MOVIE-1'], name: 'Test' },
        mutate: jest.fn(),
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should update correctly when movieId changes', async () => {
      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1'], name: 'Test' },
        mutate: jest.fn(),
      } as any);

      const { rerender } = render(<FavoriteButton movieId="movie-1" />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();

      mockUseCurrentProfil.mockReturnValue({
        data: { id: 'profil-1', favoriteIds: ['movie-1'], name: 'Test' },
        mutate: jest.fn(),
      } as any);
      mockUseFavorites.mockReturnValue(defaultMockFavorites as any);

      rerender(<FavoriteButton movieId="movie-2" />);
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });
  });

  describe('Mocking Verification', () => {
    it('should use useCurrentProfil hook', () => {
      render(<FavoriteButton movieId="movie-1" />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });

    it('should use useFavorites hook with movieId', () => {
      render(<FavoriteButton movieId="movie-1" />);
      expect(mockUseFavorites).toHaveBeenCalledWith('movie-1');
    });

    it('should import add action', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: [] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalled();
      });
    });

    it('should import remove action', async () => {
      mockUseCurrentProfil.mockReturnValue({
        ...defaultMockData,
        data: { ...defaultMockData.data, favoriteIds: ['movie-1'] },
      } as any);

      render(<FavoriteButton movieId="movie-1" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalled();
      });
    });
  });

  describe('Button Element Properties', () => {
    it('should be a native button element', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should be clickable', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).toBeEnabled();
    });

    it('should not have disabled attribute', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have accessible role', () => {
      render(<FavoriteButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('role')).not.toBe('presentation');
    });

    it('should render correctly with React.FC typing', () => {
      const { container } = render(<FavoriteButton movieId="movie-1" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
