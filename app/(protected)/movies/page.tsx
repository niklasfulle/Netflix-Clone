"use client";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";

import Footer from "@/components/Footer";
import InfoModal from "@/components/InfoModal";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import { useActorPagination } from "@/hooks/catalog/useActorPagination";
import useNewMovieList2 from "@/hooks/movies/useNewMovieList2";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";

import BillboardMovie from "./_components/BillboardMovie";
import FilterRowMovies from "./_components/FilterRowMovies";

const MoviesPage = () => {
  const { data: newMovies = [], isLoading: isLoadingNewMovieList2 } =
    useNewMovieList2();

  const { data: profil } = useCurrentProfil();
  const { data: playlists } = usePlaylists();
  const { isOpen, closeModal } = useInfoModal();

  const { actors, hasMore, loadMore } = useActorPagination("movies");

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
      <BillboardMovie />
      <div className="min-h-screen">
        <MovieList
          title="New"
          data={newMovies}
          isLoading={isLoadingNewMovieList2}
        />
        {actors.map((actor: string, index: number) => (
          <FilterRowMovies key={actor} title={actor} deferLoading={index > 0} />
        ))}
        {hasMore && (
          <div className="flex flex-row items-center justify-center w-full h-8 pt-12 pb-28">
            <button
              onClick={loadMore}
              type="button"
              className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md cursor-pointer hover:bg-red-700 max-w-32"
            >
              Load more
            </button>
          </div>
        )}
        {!hasMore && (
          <div className="flex flex-row items-center justify-center w-full h-8 pb-20"></div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MoviesPage;
