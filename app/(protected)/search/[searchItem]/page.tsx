"use client";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useParams, useRouter } from "next/navigation";
import useSearchItem from "@/hooks/useSearchItem";
import SearchList from "../_components/SearchList";

export default function MoviesPage() {
  const params = useParams<{ searchItem: string }>();
  const { data: profil } = useCurrentProfil();
  const { data: results, isLoading: isLoadingSearch } = useSearchItem(
    params.searchItem
  );
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
        <title>Netflix - Search</title>
        <meta property="og:title" content="Netflix - Search" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </header>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="pt-40 pb-40">
        <SearchList
          title="Search Result"
          data={results}
          isLoading={isLoadingSearch}
        />
      </div>
    </>
  );
}
