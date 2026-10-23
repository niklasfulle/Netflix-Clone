import { fireEvent, render, screen } from '@testing-library/react';
import Watch from '../page';

const mockPush = jest.fn();
const mockMovie = jest.fn();
let mockSearch = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useParams: () => ({ movieId: 'movie1' }),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearch,
}));
jest.mock('@/hooks/movies/useMovie', () => ({ __esModule: true, default: (...args: unknown[]) => mockMovie(...args) }));
jest.mock('@/components/player/VideoPlayer', () => ({
  __esModule: true,
  default: ({ items, startTime, onBack }: any) => <div data-testid="player" data-start={startTime} data-items={JSON.stringify(items)}><button onClick={onBack}>Leave player</button></div>,
}));

beforeEach(() => { jest.clearAllMocks(); mockSearch = new URLSearchParams(); mockMovie.mockReturnValue({ data: { id: 'movie1', title: 'Movie One', watchTime: 25 } }); });

it('passes the title and progress to the shared player', () => {
  render(<Watch />);
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!)[0]).toMatchObject({ id: 'movie1', title: 'Movie One', watchTime: 25 });
});

it('provides a readable title for content without a catalog title', () => {
  mockMovie.mockReturnValue({ data: { id: 'movie1' } });
  render(<Watch />);
  expect(JSON.parse(screen.getByTestId('player').getAttribute('data-items')!)[0].title).toBe('Now playing');
});

it.each([['start=true', '0'], ['start=0', '0'], ['start=45', '45'], ['start=-1', '0'], ['start=Infinity', '0']])('handles an explicit playback start: %s', (query, expected) => {
  mockSearch = new URLSearchParams(query); render(<Watch />);
  expect(screen.getByTestId('player')).toHaveAttribute('data-start', expected);
});

it('preserves a local return path', () => {
  mockSearch = new URLSearchParams('from=/mylist'); render(<Watch />);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/mylist');
});

it.each(['https://example.com', '//example.com'])('does not navigate to an external return path: %s', from => {
  mockSearch = new URLSearchParams({ from }); render(<Watch />);
  fireEvent.click(screen.getByRole('button', { name: 'Leave player' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

it('distinguishes loading from missing content', () => {
  mockMovie.mockReturnValue({ data: undefined, isLoading: true });
  const { rerender } = render(<Watch />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  mockMovie.mockReturnValue({ data: undefined, isLoading: false });
  rerender(<Watch />);
  expect(screen.getByRole('heading')).toHaveTextContent('The movie or series could not be found.');
});
