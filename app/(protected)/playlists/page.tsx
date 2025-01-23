"use client";
import { isEmpty } from 'lodash';
import { useRouter } from 'next/navigation';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import useCreatePlaylistModal from '@/hooks/playlists/useCreatePlaylistModal';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useUpdatePlaylistModal from '@/hooks/playlists/useUpdatePlaylistModal';
import useCurrentProfil from '@/hooks/useCurrentProfil';

import PlaylistCreateModal from './_components/PlaylistCreateModal';
import PlaylistEditModal from './_components/PlaylistEditModal';
import PlaylistsList from './_components/PlaylistsList';

export default function SeriesPage() {
  const { data: profil } = useCurrentProfil();
  const {
    isOpen: isOpenCreate,
    openModal: openModalCreate,
    closeModal: closeModalCreate,
  } = useCreatePlaylistModal();
  const {
    isOpen: isOpenEdit,
    openModal: openModalEdit,
    closeModal: closeModalEdit,
  } = useUpdatePlaylistModal();
  const { data: playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <PlaylistCreateModal visible={isOpenCreate} onClose={closeModalCreate} />
      <PlaylistEditModal visible={isOpenEdit} onClose={closeModalEdit} />
      <Navbar />
      <div className="pt-40 pb-40 h-lvh">
        <PlaylistsList
          title="Playlists"
          data={playlists}
          isLoading={isLoadingPlaylists}
          openModalCreate={openModalCreate}
          openModalEdit={openModalEdit}
        />
      </div>
      <Footer />
    </>
  );
}
