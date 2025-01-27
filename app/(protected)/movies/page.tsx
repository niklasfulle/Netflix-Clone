"use client";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Footer from "@/components/Footer";
import InfoModal from "@/components/InfoModal";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import useGetActors from "@/hooks/movies/useGetActors";
import useGetActorsCount from "@/hooks/movies/useGetActorsCount";
import useNewMovieList2 from "@/hooks/movies/useNewMovieList2";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";

import BillboardMovie from "./_components/BillboardMovie";
import FilterRowMovies from "./_components/FilterRowMovies";

const MoviesPage = () => {
  const [limit, setLimit] = useState(3);
  const { data: newMovies = [], isLoading: isLoadingNewMovieList2 } =
    useNewMovieList2();
  const { data: actorsCount } = useGetActorsCount();
  const { data: actors = [] } = useGetActors(limit);
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

  const loadMore = () => {
    setLimit(limit + 5);
  };

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
        {actors.map((actor: string) => (
          <FilterRowMovies key={actor} title={actor} />
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
};

export default MoviesPage;
