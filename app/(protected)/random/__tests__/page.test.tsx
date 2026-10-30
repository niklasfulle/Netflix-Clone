import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import RandomPage from '../page';
import useRandom from '@/hooks/useRandom';
import { addMovieView } from '@/actions/watch/add-movie-view';
import type VideoPlayer from '@/components/player/VideoPlayer';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/hooks/useRandom');
jest.mock('@/actions/watch/add-movie-view', () => ({ addMovieView: jest.fn() }));
jest.mock('@/components/player/VideoPlayer', () => ({
  __esModule: true,
  default: ({ items, onBack }: ComponentProps<typeof VideoPlayer>) => <section aria-label="Shared video player" data-items={JSON.stringify(items)}><h1>{items[0].title}</h1><button onClick={onBack}>Leave player</button></section>,
}));

const movie = {
  id: 'movie-1', title: 'Forest walk', thumbnailUrl: '/neutral.jpg', watchTime: 24,
  categories: [{ id: 'forest', name: 'Wald', nameEn: 'Forest' }],
  categorySegments: [{ categoryId: 'forest', startSeconds: 10, endSeconds: 20, category: { id: 'forest', name: 'Wald', nameEn: 'Forest' } }],
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRandom).mockReturnValue({ data: movie, error: undefined, isLoading: false } as never);
});

it('uses the shared player with the random title, categories, timeline and saved progress', () => {
  render(<RandomPage />);
  const player = screen.getByRole('region', { name: 'Shared video player' });
  expect(JSON.parse(player.getAttribute('data-items')!)).toEqual([movie]);
  expect(screen.getByRole('heading', { name: 'Forest walk' })).toBeInTheDocument();
  expect(addMovieView).not.toHaveBeenCalled();
});

it('returns home through the shared player back action', () => {
  render(<RandomPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('shows a loading state while selecting a random video', () => {
  jest.mocked(useRandom).mockReturnValue({ data: undefined, error: undefined, isLoading: true });
  render(<RandomPage />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Shared video player' })).not.toBeInTheDocument();
});

it('offers a safe exit when no random video is available', () => {
  jest.mocked(useRandom).mockReturnValue({ data: undefined, error: new Error('unavailable'), isLoading: false });
  render(<RandomPage />);
  expect(screen.getByText('The movie or series could not be found.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('uses the standard player title when a random item has no title', () => {
  jest.mocked(useRandom).mockReturnValue({ data: { id: 'movie-1' }, error: undefined, isLoading: false });
  render(<RandomPage />);
  expect(screen.getByRole('heading', { name: 'Now playing' })).toBeInTheDocument();
});
