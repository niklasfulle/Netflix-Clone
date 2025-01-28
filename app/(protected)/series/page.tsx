"use client";
import axios from "axios";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/Footer";
import InfoModal from "@/components/InfoModal";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useNewSeriesList from "@/hooks/series/useNewSeriesList";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";

import BillboardSeries from "./_components/BillboardSeries";
import FilterRowSeries from "./_components/FilterRowSeries";

export default function SeriesPage() {
  const { data: newSeries = [], isLoading: isLoadingNewSeries } =
    useNewSeriesList();

  const { data: profil } = useCurrentProfil();
  const { data: playlists } = usePlaylists();
  const { isOpen, closeModal } = useInfoModal();

  const [actorsCount, setActorsCount] = useState(0);
  const [start, setStart] = useState(0);
  const [limit, setLimit] = useState(3);
  const [actors, setActors] = useState([]);

  // Define a memoized function for fetching the product list
  const fetchActorsCount = useMemo(
    () => async () => {
      try {
        const response = await axios.get("/api/series/getActorsCount"); // Replace with your API endpoint
        setActorsCount(response.data);
      } catch (error) {
        console.error("Error fetching Actors Count:", error);
      }
    },
    []
  );

  // Fetch the product list on component mount
  useEffect(() => {
    fetchActorsCount();
  }, [fetchActorsCount]);

  const fetchActors = useMemo(
    () => async () => {
      try {
        const response = await axios.get(
          `/api/series/getActors/${start}_${limit}`
        ); // Replace with your API endpoint

        setActors(actors.concat(response.data));
      } catch (error) {
        console.error("Error fetching Series:", error);
      }
    },
    [start]
  );

  // Fetch the product list on component mount
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
}
