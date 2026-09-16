import { isEmpty } from 'lodash';
import Link from 'next/link';
import React from 'react';

import MovieCard from '@/components/MovieCard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

interface SearchListProps {
  data: CatalogItemDto[];
  title: string;
  isLoading: boolean;
}

const SearchList: React.FC<SearchListProps> = ({ data, title, isLoading }) => {
  const { t } = useLanguage();

  if (isEmpty(data)) {
    return (
      <div className="px-4 my-6 space-y-8 md:px-12">
        <div>
          <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
            {title}
          </p>
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center text-zinc-400">
              {t('Loading...')}
            </div>
          ) : (
            <div className="mt-4 flex min-h-64 flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 text-center">
              <p className="text-lg font-semibold text-white">
                {t('You have not added any favorites yet.')}
              </p>
              <Link
                href="/movies"
                className="rounded-md bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('Browse')}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-4">
          {data.map((movie) => (
            <MovieCard key={movie.id} data={movie} isLoading={isLoading} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchList;
