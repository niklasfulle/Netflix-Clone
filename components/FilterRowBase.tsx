import { isEmpty } from 'lodash';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaRandom } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

import Thumbnail from '@/components/Thumbnail';
import {
  RANDOM_PLAYLIST_STORAGE_KEY,
  compactPlaylistMovies,
  shuffleMovies,
} from '@/lib/random-playlist';
import { Movie } from '@prisma/client';
import {
  DEBUG_QUERY,
  isDebugEnabled,
  recordDebug,
} from '@/lib/debug';

interface FilterRowBaseProps {
  title: string;
  movies: Movie[];
  isLoading: boolean;
}

const FilterRowBase: React.FC<FilterRowBaseProps> = ({ title, movies, isLoading }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const playRandom = () => {
    recordDebug('playlist_click_received', { title, movieCount: movies.length });

    if (movies.length < 2) {
      recordDebug('playlist_rejected', { reason: 'fewer_than_two_videos' });
      return;
    }

    try {
      const compactMovies = compactPlaylistMovies(shuffleMovies(movies));
      const serializedPlaylist = JSON.stringify({
        title,
        movies: compactMovies,
        returnPath: isDebugEnabled()
          ? `${pathname}?${DEBUG_QUERY}`
          : pathname,
      });
      recordDebug('playlist_serialized', {
        movieCount: compactMovies.length,
        characters: serializedPlaylist.length,
      });
      sessionStorage.removeItem(RANDOM_PLAYLIST_STORAGE_KEY);
      sessionStorage.setItem(
        RANDOM_PLAYLIST_STORAGE_KEY,
        serializedPlaylist,
      );
      const storedPlaylist = sessionStorage.getItem(RANDOM_PLAYLIST_STORAGE_KEY);
      recordDebug('playlist_storage_verified', {
        stored: storedPlaylist !== null,
        characters: storedPlaylist?.length ?? 0,
      });
      const target = isDebugEnabled()
        ? `/watch/random?${DEBUG_QUERY}`
        : '/watch/random';
      recordDebug('playlist_navigation_started', { target });
      router.push(target);
    } catch (error) {
      recordDebug('playlist_error', {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
      });
      toast.error('Playlist could not be started. Please try again.');
    }
  };

  const updateScrollState = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    const maxScrollLeft = Math.max(0, row.scrollWidth - row.clientWidth);
    setCanScrollLeft(row.scrollLeft > 1);
    setCanScrollRight(row.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateScrollState);

    if (rowRef.current) resizeObserver?.observe(rowRef.current);

    return () => {
      window.removeEventListener('resize', updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [movies, updateScrollState]);

  const handleClick = (direction: 'left' | 'right') => {
    const row = rowRef.current;

    if (row) {
      const { scrollLeft, clientWidth, scrollWidth } = row;
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

      const nextScrollLeft =
        direction === "left"
          ? Math.max(0, scrollLeft - clientWidth)
          : Math.min(maxScrollLeft, scrollLeft + clientWidth);

      row.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
    }
  };

  return (
    <div className="h-auto px-4 mt-2 space-y-4 md:space-y-8 lg:mt-4 md:px-12">
      <div className="relative z-30 flex items-center gap-3 -mb-8">
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        {movies.length >= 2 && (
          <button
            type="button"
            onPointerDown={() => recordDebug('playlist_pointer_down', { title })}
            onTouchStart={() => recordDebug('playlist_touch_start', { title })}
            onClick={playRandom}
            className="flex items-center justify-center w-11 h-11 text-white transition-colors bg-transparent cursor-pointer touch-manipulation hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
            aria-label={`Play ${title} in random order`}
            title={`Play ${title} in random order`}
          >
            <FaRandom className="pointer-events-none" size={22} aria-hidden="true" />
          </button>
        )}
      </div>
      {!isEmpty(movies) && (
        <div className="relative h-auto group">
          {canScrollLeft && (
            <FaChevronLeft
              size={30}
              className="hidden text-white absolute top-0 bottom-0 left-2 z-20 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 md:block"
              onClick={() => handleClick("left")}
            />
          )}
          <div
            ref={rowRef}
            onScroll={updateScrollState}
            className="flex items-center h-44 space-x-0.5 overflow-x-auto overscroll-x-contain touch-pan-x snap-x snap-mandatory md:space-x-2.5 md:overflow-x-hidden md:snap-none scrollbar-hide"
          >
            {movies.map((movie: Movie) => (
              <div key={movie.id} className="shrink-0 snap-start">
                <Thumbnail
                  data={movie}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>
          {canScrollRight && (
            <FaChevronRight
              size={30}
              className="hidden text-white absolute top-0 bottom-0 right-2 z-20 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 md:block"
              onClick={() => handleClick("right")}
            />
          )}
        </div>
      )}
      {isEmpty(movies) && (
        <output className="flex flex-row items-center justify-center w-full h-24">
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
        </output>
      )}
    </div>
  );
};

export default FilterRowBase;
