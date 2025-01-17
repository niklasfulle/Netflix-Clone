"use client";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import useNewSeriesList from "@/hooks/series/useNewSeriesList";
import MovieList from "@/components/MovieList";
import useGetActors from "@/hooks/series/useGetActors"; // Ensure this path is correct
import { useState } from "react";
import useGetActorsCount from "@/hooks/series/useGetActorsCount";
import BillboardSeries from "./_components/BillboardSeries";
import FilterRowSeries from "./_components/FilterRowSeries";
import Footer from "@/components/Footer";

export default function SeriesPage() {
  const [limit, setLimit] = useState(3);
  const { data: newSeries = [], isLoading: isLoadingNewSeries } =
    useNewSeriesList();
  const { data: actorsCount } = useGetActorsCount();
  const { data: actors = [] } = useGetActors(limit);
  const { data: profil } = useCurrentProfil();
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  const loadMore = () => {
    setLimit(limit + 5);
  };

  return (
    <>
      <header>
        <title>Netflix - Series</title>
        <meta property="og:title" content="Netflix - Series" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <BillboardSeries />
      <div className="min-h-screen">
        <MovieList
          title="New"
          data={newSeries}
          isLoading={isLoadingNewSeries}
        />
        {actors.map((actor: string) => (
          <FilterRowSeries key={actor} title={actor} />
        ))}
        {limit < actorsCount && (
          <div className="flex flex-row items-center justify-center w-full h-8 pt-12 pb-28">
            <button
              onClick={() => loadMore()}
              type="button"
              className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md cursor-pointer hover:bg-red-700 max-w-32"
            >
              Load more
            </button>
          </div>
        )}
        {limit >= actorsCount && (
          <div className="flex flex-row items-center justify-center w-full h-8 pb-20"></div>
        )}
      </div>
      <Footer />
    </>
  );
}
