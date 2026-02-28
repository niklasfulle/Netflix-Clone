"use client";
import { isEmpty } from 'lodash';
import { useParams, useRouter } from 'next/navigation';

import InfoModal from '@/components/InfoModal';
import Navbar from '@/components/Navbar';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useInfoModal from '@/hooks/useInfoModal';
import useSearchItem from '@/hooks/useSearchItem';

import SearchList from '../_components/SearchList';
import Footer from '@/components/Footer';

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
        {isEmpty(results) && !isLoadingSearch ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-white text-lg md:text-2xl">
              No results found for "{params.searchItem.replace(/%20/g, ' ')}"
            </p>
          </div>
        ) : (
          <SearchList
            title="Search Result for:"
            data={results}
            isLoading={isLoadingSearch}
            searchItem={params.searchItem}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
