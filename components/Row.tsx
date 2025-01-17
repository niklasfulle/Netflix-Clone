import React, { useRef, useState } from "react";
import { isEmpty } from "lodash";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Thumbnail from "@/components/Thumbnail";

interface RowProps {
  data: Record<string, any>[];
  title: string;
  isLoading: boolean;
}

const Row: React.FC<RowProps> = ({ data, title, isLoading }) => {
  const [isMoved, setIsMoved] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  if (isEmpty(data)) {
    return null;
  }

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
      <div>
        <p className="-mb-8 font-semibold text-white text-md md:text-xl lg:text-2xl sm:mb-0">
          {title}
        </p>
        <div className="relative h-auto group">
          <FaChevronLeft
            size={30}
            className={`text-white absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 ${
              !isMoved && "hidden"
            }`}
            onClick={() => handleClick("left")}
          />
          <div
            ref={rowRef}
            className="flex items-center space-x-0.5 overflow-x-hidden md:space-x-2.5 scrollbar-hide h-44"
          >
            {data.map((movie) => (
              <Thumbnail key={movie.id} data={movie} isLoading={isLoading} />
            ))}
          </div>
          <FaChevronRight
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
