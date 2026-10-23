import { render, screen } from '@testing-library/react';
import PlaylistCover from '../PlaylistCover';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} data-testid="cover-image" />,
}));

const movies = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1), thumbnailUrl: `/movie-${index + 1}.jpg`,
}));

it.each([[1, 1], [3, 1], [4, 4], [6, 4]])('shows the appropriate previews for %i titles', (count, expected) => {
  render(<PlaylistCover movies={movies.slice(0, count)} />);
  expect(screen.getAllByTestId('cover-image')).toHaveLength(expected);
  expect(screen.getAllByTestId('cover-image')[0]).toHaveAttribute('src', '/movie-1.jpg');
});

it('uses the catalog thumbnail fallback when a thumbnail is missing', () => {
  render(<PlaylistCover movies={[{ id: 'movie/1' }]} />);
  expect(screen.getByTestId('cover-image')).toHaveAttribute('src', '/api/catalog/thumbnails/movie%2F1');
});

it('renders the provided empty artwork without images', () => {
  render(<PlaylistCover movies={[]} emptyIcon={<span>Empty favorites</span>} />);
  expect(screen.getByText('Empty favorites')).toBeInTheDocument();
  expect(screen.queryByTestId('cover-image')).not.toBeInTheDocument();
});

it('renders the default empty artwork when movies have not arrived yet', () => {
  const { container } = render(<PlaylistCover />);
  expect(screen.queryByTestId('cover-image')).not.toBeInTheDocument();
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});

it('uses a safe catalog fallback for an incomplete catalog entry', () => {
  render(<PlaylistCover movies={[{}]} />);
  expect(screen.getByTestId('cover-image')).toHaveAttribute('src', '/api/catalog/thumbnails/');
});
