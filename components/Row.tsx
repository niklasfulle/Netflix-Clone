import React, { useRef, useState } from "react";
import { isEmpty } from "lodash";
import MovieCard from "./MovieCard";
import { BiChevronRight, BiChevronLeft } from "react-icons/Bi";
import Thumbnail from "./Thumbnail";

interface RowProps {
  data: Record<string, any>[];
  title: string;
}

const Row: React.FC<RowProps> = ({ data, title }) => {
  if (isEmpty(data)) {
    return null;
  }

  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);

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
    <div className="h-auto px-4 mt-4 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="relative h-auto group">
          <BiChevronLeft
            size={30}
            className={`text-white absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${
              !isMoved && "hidden"
            }`}
            onClick={() => handleClick("left")}
          />
          <div
            ref={rowRef}
            className="flex items-center space-x-0.5 overflow-x-scroll md:space-x-2.5 scrollbar-hide h-44"
          >
            {data.map((movie) => (
              <Thumbnail key={movie.id} data={movie} />
            ))}
          </div>
          <BiChevronRight
            size={30}
            className={`text-white absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100`}
            onClick={() => handleClick("right")}
          />
        </div>
      </div>
    </div>
  );
};

export default Row;
