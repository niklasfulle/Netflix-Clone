"use client";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";

import Footer from "@/components/Footer";
import InfoModal from "@/components/InfoModal";
import Navbar from "@/components/Navbar";

import usePlaylists from "@/hooks/playlists/usePlaylists";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";
import WatchList from "./_components/WatchList";  

export default function SeriesPage() {

  const { data: profil } = useCurrentProfil();
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
        <WatchList title="Your Watchlist" />
      </div>
      <Footer />
    </>
  );
}
