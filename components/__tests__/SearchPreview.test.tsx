import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('renders actor and configured content groups', () => {
    renderPreview({ data: results });

    expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actors' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Actor One' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Movie One' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Series One' })).toBeInTheDocument();
  });

  it('renders staging prefixes as compact result labels', () => {
    renderPreview({
      data: {
        actors: [{ id: 'actor-1', name: '[STAGING] Avery Stone' }],
        content: {},
      },
    });

    expect(screen.getByText('STAGING')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'STAGING Avery Stone' })).toBeInTheDocument();
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

    expect(screen.getAllByRole('option')).toHaveLength(10);
    expect(screen.queryByRole('option', { name: 'Actor 6' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Movie 6' })).not.toBeInTheDocument();
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
