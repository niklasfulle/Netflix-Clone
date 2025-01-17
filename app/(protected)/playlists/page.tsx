"use client";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

export default function SeriesPage() {
  const { data: profil } = useCurrentProfil();
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
      <header>
        <title>Netflix - Playlists</title>
        <meta property="og:title" content="Netflix - Playlists" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="h-svh"></div>
      <Footer />
    </>
  );
}
