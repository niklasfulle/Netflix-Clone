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
      <div className="pt-40 pb-40">
        <SearchList
          title="Search Result for:"
          data={results}
          isLoading={isLoadingSearch}
          searchItem={params.searchItem}
        />
      </div>
    </>
  );
}
