"use client";

import React from 'react';

import { useLanguage } from '@/components/providers/LanguageProvider';
import MovieCard from '@/components/MovieCard';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';
import type { SearchResultsDto } from '@/lib/search';

interface SearchListProps {
  data: SearchResultsDto | CatalogItemDto[];
  title: string;
  isLoading: boolean;
  searchItem: string;
}

function normalizeResults(data: SearchResultsDto | CatalogItemDto[]): SearchResultsDto {
  if (Array.isArray(data)) {
    return {
      actors: [],
      content: { Movie: data },
    };
  }

  return data;
}

function getContentLabel(type: string, translate: (key: 'Movies' | 'Series') => string) {
  if (type === 'Movie') return translate('Movies');
  if (type === 'Serie') return translate('Series');
  return type;
}

const SearchList: React.FC<SearchListProps> = ({
  data,
  title,
  isLoading,
  searchItem,
}) => {
  const results = normalizeResults(data);
  const contentGroups = Object.entries(results.content)
    .filter(([, items]) => items.length > 0);
  const { t } = useLanguage();

  if (results.actors.length === 0 && contentGroups.length === 0) {
    return null;
  }

  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
          <span className="pl-3 font-thin italic">{searchItem.replaceAll('%20', ' ')}</span>
        </p>
        {results.actors.length > 0 && (
          <section aria-labelledby="search-results-actors" className="mt-4">
            <h2 id="search-results-actors" className="text-sm font-semibold uppercase text-neutral-400">
              {t('Actors')}
            </h2>
            <div className="flex flex-wrap gap-3 mt-3">
              {results.actors.map((actor) => (
                <a
                  key={actor.id}
                  href={`/search/${encodeURIComponent(actor.name)}`}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                >
                  {actor.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {contentGroups.map(([type, items]) => (
          <section key={type} aria-labelledby={`search-results-${type}`} className="mt-6">
            <h2 id={`search-results-${type}`} className="text-sm font-semibold uppercase text-neutral-400">
              {getContentLabel(type, (key) => t(key))}
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-4">
              {items.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  data={movie}
                  isLoading={isLoading}
                  eager={index === 0}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SearchList;
