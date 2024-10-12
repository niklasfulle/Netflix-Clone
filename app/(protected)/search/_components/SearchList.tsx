import React from "react";
import { isEmpty } from "lodash";
import MovieCard from "@/components/MovieCard";

interface SearchListProps {
  data: Record<string, any>[];
  title: string;
}

const SearchList: React.FC<SearchListProps> = ({ data, title }) => {
  if (isEmpty(data)) {
    return null;
  }

  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-4">
          {data.map((movie) => (
            <MovieCard key={movie.id} data={movie} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchList;
