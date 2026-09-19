"use client";
import { isEmpty } from 'lodash';
import { useParams, useRouter } from 'next/navigation';

import InfoModal from '@/components/InfoModal';
import Navbar from '@/components/Navbar';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useInfoModal from '@/hooks/useInfoModal';
import useSearchItem from '@/hooks/useSearchItem';
import type { SearchResultsDto } from '@/lib/search';

import SearchList from '../_components/SearchList';
import Footer from '@/components/Footer';

function hasSearchResults(results: SearchResultsDto) {
  return results.actors.length > 0
    || Object.values(results.content).some((items) => items.length > 0);
}

export default function MoviesPage() {
  const params = useParams<{ searchItem: string }>();
  const { data: profil } = useCurrentProfil();
  const { data: results, isLoading: isLoadingSearch } = useSearchItem(
    params.searchItem
  );
  const { data: playlists } = usePlaylists();
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} playlists={playlists} />
      <Navbar />
      <div className="pt-40 pb-40 min-h-screen">
        {results && !isLoadingSearch && !hasSearchResults(results) ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-white text-lg md:text-2xl">
              No results found for &quot;{params.searchItem.replaceAll('%20', ' ')}&quot;
            </p>
          </div>
        ) : (
          <SearchList
            title="Search Result for:"
            data={results ?? { actors: [], content: {} }}
            isLoading={isLoadingSearch}
            searchItem={params.searchItem}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
