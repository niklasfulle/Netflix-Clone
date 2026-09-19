"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

import { useLanguage } from '@/components/providers/LanguageProvider';
import SearchPreview from '@/components/SearchPreview';
import useSearchItem from '@/hooks/useSearchItem';
import { MIN_SEARCH_LENGTH } from '@/lib/search';

const SearchItem = () => {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const router = useRouter();
  const { data, error, isLoading } = useSearchItem(value);

  const searchHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setValue(target.value);
  };

  const submitSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query.length >= MIN_SEARCH_LENGTH) {
      router.push(`/search/${encodeURIComponent(query)}`);
    }
  };

  return (
    <form
      className="relative w-[min(14rem,calc(100vw-8rem))] min-w-0 text-gray-600 sm:w-60 md:w-64 lg:w-72"
      onSubmit={submitSearch}
    >
      <input
        type="search"
        name="search"
        autoComplete="off"
        aria-controls="search-preview"
        aria-autocomplete="list"
        placeholder={t('Search')}
        className={`search-input h-10 w-full rounded-full border border-white/70 bg-zinc-950/70 px-4 text-sm text-white shadow-lg shadow-black/10 outline-none transition-colors placeholder:text-neutral-400 hover:border-white focus:border-white focus:ring-2 focus:ring-white/30 ${value ? 'pr-20' : 'pr-11'}`}
        onChange={(event) => searchHandler(event)}
        value={value}
      />
      {value && (
        <button
          type="button"
          aria-label={t('Clear search')}
          className="absolute right-9 top-1 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          onClick={() => setValue('')}
        >
          <FaTimes size={14} aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label={t('Search')}
      >
        <FaSearch
          size={16}
          aria-hidden="true"
        />
      </button>
      {value.trim().length >= MIN_SEARCH_LENGTH && (
        <div id="search-preview">
          <SearchPreview
            data={data}
            isLoading={isLoading}
            error={error}
            onSelect={(path) => router.push(path)}
          />
        </div>
      )}
    </form>
  );
};

export default SearchItem;
