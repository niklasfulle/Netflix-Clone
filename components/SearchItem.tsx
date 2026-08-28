"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { FaSearch } from 'react-icons/fa';

import { useLanguage } from '@/components/providers/LanguageProvider';

const SearchItem = () => {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const router = useRouter();

  const searchHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setValue(target.value);
  };

  const submitSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query) router.push(`/search/${encodeURIComponent(query)}`);
  };

  return (
    <form
      className="relative flex flex-row w-full text-gray-600"
      onSubmit={submitSearch}
    >
      <input
        type="search"
        name="search"
        placeholder={t('Search')}
        className="opacity-100 cursor-text w-full h-10 px-5 pr-10 text-sm bg-[transparent] rounded-full border-2 border-white focus:outline-none text-white placeholder:text-neutral-300"
        onChange={(event) => searchHandler(event)}
        value={value}
      />
      <button
        type="submit"
        className="absolute top-0 right-0 my-3 mr-4"
        aria-label={t('Search')}
      >
        <FaSearch
          size={18}
          className="text-white"
        />
      </button>
    </form>
  );
};

export default SearchItem;
