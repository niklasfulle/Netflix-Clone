"use client";
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchItem = () => {
  const [value, setValue] = useState("");
  const router = useRouter();

  const searchHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setValue(target.value);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
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
        placeholder={"Search"}
        className="opacity-100 cursor-text w-full h-10 px-5 pr-10 text-sm bg-[transparent] rounded-full border-2 border-white focus:outline-none text-white placeholder:text-neutral-300"
        onChange={(event) => searchHandler(event)}
        value={value}
      />
      <button
        type="submit"
        className="absolute top-0 right-0 my-3 mr-4"
        aria-label="Search"
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
