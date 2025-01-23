"use client";
import { isEmpty } from 'lodash';
import { useRouter } from 'next/navigation';

import Footer from '@/components/Footer';
import InfoModal from '@/components/InfoModal';
import Navbar from '@/components/Navbar';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useFavorites from '@/hooks/useFavorites';
import useInfoModal from '@/hooks/useInfoModal';

import SearchList from './_components/SearchList';

export default function MyListPage() {
  const { data: profil } = useCurrentProfil();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
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
      <div className="pt-40 pb-40 h-lvh">
        <SearchList
          title="My List"
          data={favoriteMovies}
          isLoading={isLoadingFavorites}
        />
      </div>
      <Footer />
    </>
  );
}
