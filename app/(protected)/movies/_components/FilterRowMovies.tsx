import React, { useRef, useState } from "react";
import { isEmpty } from "lodash";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import useMoviesByActor from "@/hooks/movies/useMoviesByActor";
import Thumbnail from "@/components/Thumbnail";
import { Movie } from "@prisma/client";

interface FilterRowMoviesProps {
  title: string;
}

const FilterRowMovies: React.FC<FilterRowMoviesProps> = ({ title }) => {
  const [isMoved, setIsMoved] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { data: movies = [] } = useMoviesByActor(title);

  const handleClick = (direction: string) => {
    setIsMoved(true);

    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;

      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;

      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="h-auto px-4 mt-2 space-y-4 md:space-y-8 lg:mt-4 md:px-12">
      <p className="-mb-8 font-semibold text-white text-md md:text-xl lg:text-2xl ">
        {title}
      </p>
      {!isEmpty(movies) && (
        <>
          <div className="relative h-auto group">
            <FaChevronLeft
              size={30}
              className={`text-white absolute top-0 bottom-0 left-2 z-20 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${
                !isMoved && "hidden"
              }`}
              onClick={() => handleClick("left")}
            />
            <div
              ref={rowRef}
              className="flex items-center space-x-0.5 overflow-x-hidden md:space-x-2.5 scrollbar-hide h-44"
            >
              {movies.map((movie: Movie) => (
                <Thumbnail key={movie.id} data={movie} />
              ))}
            </div>
            <FaChevronRight
              size={30}
              className={`text-white absolute top-0 bottom-0 right-2 z-20 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100`}
              onClick={() => handleClick("right")}
            />
          </div>
        </>
      )}
      {isEmpty(movies) && (
        <div
          role="status"
          className="flex flex-row items-center justify-center w-full h-24"
        >
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default FilterRowMovies;
