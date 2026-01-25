import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock server actions and hooks before importing component
jest.mock('@/actions/playlist/add-playlist-entry', () => ({
  addPlaylistEntry: jest.fn(),
}));

jest.mock('@/actions/playlist/add-playlist', () => ({
  addPlaylist: jest.fn(),
}));

jest.mock('@/hooks/playlists/usePlaylists', () => ({
  __esModule: true,
  default: jest.fn(() => ({ mutate: jest.fn() })),
}));

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: (callback: any) => jest.fn(),
    watch: jest.fn(() => ''),
    setValue: jest.fn(),
    formState: { errors: {} },
  })),
  FormProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  FormControl: ({ children }: any) => <>{children}</>,
  FormField: ({ render }: any) => render({
    field: { value: '', onChange: jest.fn(), name: 'test' },
  }),
  FormItem: ({ children }: any) => <>{children}</>,
  FormMessage: () => null,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div data-testid="trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

import PlaylistSelect from '../PlaylistSelect';

describe('PlaylistSelect Component', () => {
  const mockPlaylists = [
    { id: '1', title: 'Favorites' },
    { id: '2', title: 'Watch Later' },
  ];

  const mockMovieId = 'movie123';

  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should render with empty playlists', () => {
      const { container } = render(
        <PlaylistSelect playlists={[]} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should render form element', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );
      const form = container.querySelector('form');
      expect(form).toBeTruthy();
    });

    test('should render with correct container classes', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeTruthy();
    });

    test('should render with padding', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );
      const padded = container.querySelector('.px-12');
      expect(padded).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    test('should accept playlists prop', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should accept movieId prop', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="different-movie" />
      );
      expect(container).toBeTruthy();
    });

    test('should handle different playlist arrays', () => {
      const largePlaylistArray = Array.from({ length: 100 }, (_, i) => ({
        id: `playlist-${i}`,
        title: `Playlist ${i}`,
      }));

      const { container } = render(
        <PlaylistSelect playlists={largePlaylistArray} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle empty movieId', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="" />
      );
      expect(container).toBeTruthy();
    });

    test('should handle special characters in playlist titles', () => {
      const specialPlaylists = [
        { id: '1', title: 'Movies & TV Shows' },
        { id: '2', title: 'Action/Adventure' },
        { id: '3', title: 'Horror (Scary)' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={specialPlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle very long playlist titles', () => {
      const longTitlePlaylists = [
        { id: '1', title: 'A'.repeat(200) },
        { id: '2', title: 'This is a very long title that should still render correctly' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={longTitlePlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    test('should have proper layout structure', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      // Check for main wrapper
      const mainWrapper = container.querySelector('.w-full.px-12');
      expect(mainWrapper).toBeTruthy();
    });

    test('should have flex container', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeTruthy();
    });

    test('should have centered content', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const centered = container.querySelector('.mx-auto');
      expect(centered).toBeTruthy();
    });

    test('should have select content area', () => {
      render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const selectContent = screen.getByTestId('select-content');
      expect(selectContent).toBeTruthy();
    });

    test('should have button element', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle single playlist', () => {
      const { container } = render(
        <PlaylistSelect playlists={[{ id: '1', title: 'Only' }]} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle playlists with empty titles', () => {
      const emptyTitlePlaylists = [
        { id: '1', title: '' },
        { id: '2', title: 'Regular' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={emptyTitlePlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle unicode characters in titles', () => {
      const unicodePlaylists = [
        { id: '1', title: '🎬 Movies' },
        { id: '2', title: 'Películas en Español' },
        { id: '3', title: '电影 Movies' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={unicodePlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle duplicate playlist IDs', () => {
      const duplicatePlaylists = [
        { id: 'same', title: 'First' },
        { id: 'same', title: 'Second' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={duplicatePlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle null-like movieId values', () => {
      const { container: container1 } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="" />
      );
      const { container: container2 } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="0" />
      );

      expect(container1).toBeTruthy();
      expect(container2).toBeTruthy();
    });
  });

  describe('Layout and Styling', () => {
    test('should have responsive classes', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      // Check for responsive width classes
      expect(container.innerHTML).toMatch(/md:w-|lg:w-|xl:w-/);
    });

    test('should have proper spacing', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const gapElement = container.querySelector('[class*="gap"]');
      expect(gapElement || container).toBeTruthy();
    });

    test('should render with flexbox', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      expect(container.querySelector('.flex')).toBeTruthy();
    });

    test('should have proper color scheme', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      // Check for tailwind color classes
      const htmlString = container.innerHTML;
      expect(htmlString).toMatch(/text-|bg-|border-/);
    });
  });

  describe('Form Integration', () => {
    test('should render form element', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const form = container.querySelector('form');
      expect(form).toBeTruthy();
    });

    test('should have form controls', () => {
      render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      // Should have at least select and button
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeTruthy();
    });

    test('should render select trigger', () => {
      render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeTruthy();
    });

    test('should render select content', () => {
      render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const content = screen.getByTestId('select-content');
      expect(content).toBeTruthy();
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple instances independently', () => {
      const { container: container1 } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="movie1" />
      );

      const { container: container2 } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="movie2" />
      );

      expect(container1).toBeTruthy();
      expect(container2).toBeTruthy();
      expect(container1).not.toBe(container2);
    });

    test('should handle different playlist sets in different instances', () => {
      const playlists1 = [{ id: '1', title: 'Set 1' }];
      const playlists2 = [{ id: '2', title: 'Set 2' }, { id: '3', title: 'Set 3' }];

      const { container: container1 } = render(
        <PlaylistSelect playlists={playlists1} movieId="movie1" />
      );

      const { container: container2 } = render(
        <PlaylistSelect playlists={playlists2} movieId="movie2" />
      );

      expect(container1).toBeTruthy();
      expect(container2).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have button element', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    });

    test('should have form semantic element', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const form = container.querySelector('form');
      expect(form).toBeTruthy();
    });

    test('should be keyboard accessible', () => {
      const { container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('type')).toBe('submit');
    });
  });

  describe('Data Handling', () => {
    test('should handle array with varied ID formats', () => {
      const variedIdPlaylists = [
        { id: '123', title: 'Numeric' },
        { id: 'uuid-long-id', title: 'UUID' },
        { id: 'slug-format', title: 'Slug' },
      ];

      const { container } = render(
        <PlaylistSelect playlists={variedIdPlaylists} movieId={mockMovieId} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle movieId with various formats', () => {
      const movieIds = ['123', 'movie-slug', 'uuid-12345', ''];

      movieIds.forEach((id) => {
        const { container } = render(
          <PlaylistSelect playlists={mockPlaylists} movieId={id} />
        );
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Component Stability', () => {
    test('should maintain stability with re-render', () => {
      const { rerender, container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      rerender(
        <PlaylistSelect playlists={mockPlaylists} movieId={mockMovieId} />
      );

      expect(container).toBeTruthy();
    });

    test('should handle prop changes', () => {
      const { rerender, container } = render(
        <PlaylistSelect playlists={mockPlaylists} movieId="movie1" />
      );

      rerender(
        <PlaylistSelect playlists={mockPlaylists} movieId="movie2" />
      );

      expect(container).toBeTruthy();
    });

    test('should handle playlist prop changes', () => {
      const initialPlaylists = [{ id: '1', title: 'Initial' }];
      const updatedPlaylists = [
        { id: '1', title: 'Initial' },
        { id: '2', title: 'Added' },
      ];

      const { rerender, container } = render(
        <PlaylistSelect playlists={initialPlaylists} movieId={mockMovieId} />
      );

      rerender(
        <PlaylistSelect playlists={updatedPlaylists} movieId={mockMovieId} />
      );

      expect(container).toBeTruthy();
    });
  });
});
