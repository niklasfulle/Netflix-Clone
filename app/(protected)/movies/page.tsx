"use client";
import axios from "axios";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/Footer";
import InfoModal from "@/components/InfoModal";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
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

  const [actorsCount, setActorsCount] = useState(0);
  const [start, setStart] = useState(0);
  const [limit, setLimit] = useState(3);
  const [actors, setActors] = useState([]);

  const fetchActorsCount = useMemo(
    () => async () => {
      try {
        const response = await axios.get("/api/movies/getActorsCount");
        setActorsCount(response.data);
      } catch (error) {
        console.error("Error fetching Movies:", error);
      }
    },
    []
  );

  useEffect(() => {
    fetchActorsCount();
  }, [fetchActorsCount]);

  const fetchActors = useMemo(
    () => async () => {
      try {
        const response = await axios.get(
          `/api/movies/getActors/${start}_${limit}`
        );
        setActors(actors.concat(response.data));
      } catch (error) {
        console.error("Error fetching product list:", error);
      }
    },
    [start]
  );

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  const loadMore = () => {
    setStart(start + limit);
    setLimit(5);
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
        {start < actorsCount && (
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
        {start >= actorsCount && (
          <div className="flex flex-row items-center justify-center w-full h-8 pb-20"></div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MoviesPage;
