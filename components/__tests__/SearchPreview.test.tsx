import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LanguageProvider } from '@/components/providers/LanguageProvider';
import type { SearchResultsDto } from '@/lib/search';
import SearchPreview from '../SearchPreview';

function renderPreview(props: Partial<React.ComponentProps<typeof SearchPreview>> = {}) {
  return render(
    <LanguageProvider initialLocale="en">
      <SearchPreview
        data={undefined}
        isLoading={false}
        error={undefined}
        onSelect={jest.fn()}
        {...props}
      />
    </LanguageProvider>,
  );
}

const results: SearchResultsDto = {
  actors: [{ id: 'actor-1', name: 'Actor One' }],
  content: {
    Movie: [{ id: 'movie-1', title: 'Movie One', type: 'Movie' }],
    Serie: [{ id: 'serie-1', title: 'Series One', type: 'Serie' }],
  },
};

describe('SearchPreview', () => {
  it('navigates using encoded actor names and content ids', () => {
    const onSelect = jest.fn();
    renderPreview({ data: { actors: [{ id: 'actor', name: 'Alex & Sam' }], content: { Documentary: [{ id: 'film/one', title: 'Nature' }] } }, onSelect });
    fireEvent.click(screen.getByRole('button', { name: 'Alex & Sam' }));
    expect(onSelect).toHaveBeenLastCalledWith('/search/Alex%20%26%20Sam');
    expect(screen.getByRole('heading', { name: 'Documentary' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nature' }));
    expect(onSelect).toHaveBeenLastCalledWith('/watch/film%2Fone');
  });

  it('tolerates partial responses and does not navigate for content without an id', () => {
    const onSelect = jest.fn();
    const { rerender } = renderPreview({ data: {} as SearchResultsDto, onSelect });
    expect(screen.getByRole('status')).toHaveTextContent('No results found.');
    rerender(<LanguageProvider initialLocale="en"><SearchPreview data={{ actors: [], content: { Movie: [{ title: 'Unavailable' }, {}] } }} isLoading={false} onSelect={onSelect} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Unavailable' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
  it('renders actor and configured content groups', () => {
    renderPreview({ data: results });

    expect(screen.getByRole('region', { name: 'Search results' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actors' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actor One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Movie One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Series One' })).toBeInTheDocument();
  });

  it('renders staging prefixes as compact result labels', () => {
    renderPreview({
      data: {
        actors: [{ id: 'actor-1', name: '[STAGING] Avery Stone' }],
        content: {},
      },
    });

    expect(screen.getByText('STAGING')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'STAGING Avery Stone' })).toBeInTheDocument();
  });

  it('shows at most five results in each category', () => {
    renderPreview({
      data: {
        actors: Array.from({ length: 6 }, (_, index) => ({
          id: `actor-${index + 1}`,
          name: `Actor ${index + 1}`,
        })),
        content: {
          Movie: Array.from({ length: 6 }, (_, index) => ({
            id: `movie-${index + 1}`,
            title: `Movie ${index + 1}`,
            type: 'Movie',
          })),
        },
      },
    });

    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.queryByRole('button', { name: 'Actor 6' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Movie 6' })).not.toBeInTheDocument();
  });

  it('renders a loading status', () => {
    renderPreview({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('renders an error status', () => {
    renderPreview({ error: new Error('Search failed') });

    expect(screen.getByRole('alert')).toHaveTextContent('Search failed.');
  });

  it('renders an empty result status', () => {
    renderPreview({ data: { actors: [], content: { Movie: [], Serie: [] } } });

    expect(screen.getByRole('status')).toHaveTextContent('No results found.');
  });

  it('does not render before the first request has started', () => {
    const { container } = renderPreview();

    expect(container.firstChild).toBeNull();
  });
});
