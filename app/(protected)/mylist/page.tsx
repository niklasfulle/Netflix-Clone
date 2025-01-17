"use client";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import SearchList from "./_components/SearchList";
import useFavorites from "@/hooks/useFavorites";
import Footer from "@/components/Footer";

export default function MyListPage() {
  const { data: profil } = useCurrentProfil();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
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
        <title>Netflix - My List</title>
        <meta property="og:title" content="Netflix - My List" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <InfoModal visible={isOpen} onClose={closeModal} />
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
