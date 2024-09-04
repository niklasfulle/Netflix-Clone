import axios from "axios";
import React, { useCallback, useMemo } from "react";
import { FaPlus, FaCheck } from "react-icons/fa";

import useFavorites from "@/hooks/useFavorites";
import useCurrentProfil from "@/hooks/useCurrentProfil";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { mutate: mutateFavorites } = useFavorites();
  const { data: currentProfil, mutate } = useCurrentProfil();

  const isFavorite = useMemo(() => {
    const list = currentProfil?.favoriteIds || [];

    return list.includes(movieId);
  }, [currentProfil, movieId]);

  const toggleFavorites = useCallback(async () => {
    let response;

    if (isFavorite) {
      response = await axios.delete("/api/favorite", { data: { movieId } });
    } else {
      response = await axios.post("/api/favorite", { movieId });
    }

    const updatedFavoriteIds = response?.data?.favoriteIds;

    mutate({
      ...currentProfil,
      favoriteids: updatedFavoriteIds,
    });

    mutateFavorites();
  }, [movieId, isFavorite, currentProfil, mutate, mutateFavorites]);

  const Icon = isFavorite ? FaCheck : FaPlus;

  return (
    <div
      onClick={toggleFavorites}
      className="flex items-center justify-center w-6 h-6 transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
    >
      <Icon className="text-white" size={20} />
    </div>
  );
};

export default FavoriteButton;
