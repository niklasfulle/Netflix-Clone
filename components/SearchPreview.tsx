"use client";

import React from 'react';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { SearchResultsDto } from '@/lib/search';

interface SearchPreviewProps {
  data?: SearchResultsDto;
  isLoading: boolean;
  error?: Error;
  onSelect: (path: string) => void;
}

const environmentPrefix = /^\[([A-Z]+)\]\s+/;
export const MAX_SEARCH_PREVIEW_RESULTS_PER_CATEGORY = 5;

function getContentLabel(type: string, translate: (key: 'Movies' | 'Series') => string) {
  if (type === 'Movie') return translate('Movies');
  if (type === 'Serie') return translate('Series');
  return type;
}

const SearchResultLabel: React.FC<{ value: string }> = ({ value }) => {
  const prefix = value.match(environmentPrefix);

  if (!prefix) {
    return <span className="block min-w-0 truncate">{value}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-neutral-300">
        {prefix[1]}
      </span>
      <span className="min-w-0 truncate">{value.slice(prefix[0].length)}</span>
    </span>
  );
};

const SearchPreview: React.FC<SearchPreviewProps> = ({
  data,
  isLoading,
  error,
  onSelect,
}) => {
  const { t } = useLanguage();

  if (!data && !isLoading && !error) {
    return null;
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-neutral-300 shadow-2xl shadow-black/40">
        {t('Loading...')}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" aria-live="polite" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-red-300 shadow-2xl shadow-black/40">
        {t('Search failed.')}
      </div>
    );
  }

  const actorResults = data?.actors ?? [];
  const previewActors = actorResults.slice(0, MAX_SEARCH_PREVIEW_RESULTS_PER_CATEGORY);
  const contentGroups = Object.entries(data?.content ?? {})
    .filter(([, items]) => items.length > 0);

  if (previewActors.length === 0 && contentGroups.length === 0) {
    return (
      <div role="status" aria-live="polite" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-neutral-300 shadow-2xl shadow-black/40">
        {t('No results found.')}
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label={t('Search results')}
      className="search-preview absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(22rem,calc(100vh-6rem))] w-full overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-zinc-950 p-2 text-white shadow-2xl shadow-black/40"
    >
      {previewActors.length > 0 && (
        <section aria-labelledby="search-preview-actors" className="first:pt-0 [&+section]:mt-2 [&+section]:border-t [&+section]:border-white/10 [&+section]:pt-2">
          <h2 id="search-preview-actors" className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {t('Actors')}
          </h2>
          {previewActors.map((actor) => (
            <button
              key={actor.id}
              type="button"
              role="option"
              aria-selected="false"
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-100 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={() => onSelect(`/search/${encodeURIComponent(actor.name)}`)}
            >
              <SearchResultLabel value={actor.name} />
            </button>
          ))}
        </section>
      )}

      {contentGroups.map(([type, items]) => (
        <section key={type} aria-labelledby={`search-preview-${type}`} className="first:pt-0 [&+section]:mt-2 [&+section]:border-t [&+section]:border-white/10 [&+section]:pt-2">
          <h2 id={`search-preview-${type}`} className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {getContentLabel(type, (key) => t(key))}
          </h2>
          {items.slice(0, MAX_SEARCH_PREVIEW_RESULTS_PER_CATEGORY).map((item) => (
            <button
              key={item.id ?? item.title}
              type="button"
              role="option"
              aria-selected="false"
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-100 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={() => item.id && onSelect(`/watch/${encodeURIComponent(item.id)}`)}
            >
              <SearchResultLabel value={item.title ?? ''} />
            </button>
          ))}
        </section>
      ))}
    </div>
  );
};

export default SearchPreview;
