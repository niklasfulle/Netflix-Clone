import { isEmpty } from 'lodash';
import React from 'react';

import MovieCard from './MovieCard';
import type { CatalogCardDto } from '@/lib/catalog';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface MovieListProps {
  data: CatalogCardDto[];
  title: string;
  isLoading: boolean;
  loadingCount?: number;
}

const MovieList: React.FC<MovieListProps> = ({ data, title, isLoading, loadingCount = 4 }) => {
  const { message } = useLanguage();
  if (isEmpty(data) && !isLoading) {
    return null;
  }
  return (
    <div className="min-h-[235px] px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4 lg:grid-cols-4 md:gap-4">
          {isEmpty(data) ? (
            <output
              aria-label={message('sectionLoading', { name: title })}
              className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-4 md:gap-4"
            >
              {Array.from({ length: loadingCount }, (_, index) => (
                <div key={`placeholder-${index}`} aria-hidden="true" className="h-[24vw] animate-pulse rounded-md bg-zinc-900 lg:h-[12vw]" />
              ))}
            </output>
          ) : (
            data.map((movie, index) => (
              <MovieCard
                key={movie.id}
                data={movie}
                isLoading={isLoading}
                eager={index < 4}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieList;
