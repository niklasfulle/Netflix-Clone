import { isEmpty } from 'lodash';
import React, { useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import Thumbnail from '@/components/Thumbnail';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

interface RowProps {
  data: Array<Omit<CatalogItemDto, 'id' | 'title'> & {
    id?: string | number;
    title?: string | null;
  }>;
  title: string;
  isLoading: boolean;
}

const Row: React.FC<RowProps> = ({ data, title, isLoading }) => {
  const [isMoved, setIsMoved] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  if (isEmpty(data)) {
    return null;
  }

  const handleClick = (direction: 'left' | 'right') => {
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
    <div className="h-auto px-4 mt-2 space-y-4 md:space-y-8 lg:mt-4 md:px-12 [content-visibility:auto] [contain-intrinsic-size:auto_240px]">
      <div>
        <p className="-mb-8 font-semibold text-white text-md md:text-xl lg:text-2xl sm:mb-0">
          {title}
        </p>
        <div className="relative h-auto group">
          <button
            type="button"
            data-testid="chevron-left"
            aria-label={`Scroll ${title} left`}
            className={`absolute bottom-0 left-2 top-0 z-40 m-auto h-11 w-11 rounded-full text-white opacity-0 transition hover:scale-125 group-hover:opacity-100 focus-visible:opacity-100 ${
              !isMoved && "hidden"
            }`}
            onClick={() => handleClick("left")}
          >
            <FaChevronLeft className="mx-auto h-8 w-8" aria-hidden="true" />
          </button>
          <div
            ref={rowRef}
            className="flex items-center space-x-0.5 overflow-x-hidden md:space-x-2.5 scrollbar-hide h-44"
          >
            {data.map((movie, index) => (
              <Thumbnail
                key={movie.id ?? index}
                data={{
                  ...movie,
                  id: movie.id === undefined ? undefined : String(movie.id),
                  title: movie.title ?? undefined,
                }}
                isLoading={isLoading}
              />
            ))}
          </div>
          <button
            type="button"
            data-testid="chevron-right"
            aria-label={`Scroll ${title} right`}
            className="absolute bottom-0 right-2 top-0 z-40 m-auto h-11 w-11 rounded-full text-white opacity-0 transition hover:scale-125 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => handleClick("right")}
          >
            <FaChevronRight className="mx-auto h-8 w-8" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Row;
