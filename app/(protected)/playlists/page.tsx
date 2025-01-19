"use client";
import Navbar from "@/components/Navbar";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import PlaylistsList from "./_components/PlaylistsList";
import usePlaylistModal from "@/hooks/playlists/usePlaylistModal";
import PlaylistCreateModal from "./_components/PlaylistCreateModal";

export default function SeriesPage() {
  const { data: profil } = useCurrentProfil();
  const { isOpen, openModal, closeModal } = usePlaylistModal();
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
      <PlaylistCreateModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="pt-40 pb-40 h-lvh">
        <PlaylistsList
          title="Playlists"
          data={playlists}
          isLoading={isLoadingPlaylists}
          openModal={openModal}
        />
      </div>
      <Footer />
    </>
  );
}
