"use client";
import Navbar from "@/components/Navbar";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import PlaylistsList from "./_components/PlaylistsList";
import PlaylistCreateModal from "./_components/PlaylistCreateModal";
import PlaylistEditModal from "./_components/PlaylistEditModal";
import useUpdatePlaylistModal from "@/hooks/playlists/useUpdatePlaylistModal";
import useCreatePlaylistModal from "@/hooks/playlists/useCreatePlaylistModal";

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
