"use client";
import { useRouter } from "next/compat/router";
import React, { ChangeEvent, useState } from "react";
import { FaSearch } from "react-icons/fa";

export type SearchProps = {
  onSearch: (value: string) => void;
};

const SearchItem = (props: SearchProps) => {
  const [value, setValue] = useState("");
  const router = useRouter();

  const searchHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setValue(target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (value != "") router?.push(`/search?item=${value}`);
    }
  };

  return (
    <div className="relative flex flex-row w-full text-gray-600">
      <input
        type="search"
        name="search"
        placeholder={"Search"}
        className="opacity-100 cursor-text w-full h-10 px-5 pr-10 text-sm bg-[transparent] rounded-full border-2 border-white focus:outline-none text-white placeholder:text-neutral-300"
        onChange={(event) => searchHandler(event)}
        onKeyDown={handleKeyDown}
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
          onClick={() => {
            if (value != "") router?.push(`/search?item=${value}`);
          }}
        />
      </button>
    </div>
  );
};

export default SearchItem;
