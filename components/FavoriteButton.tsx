import { remove } from "@/actions/favorite/remove";
import { add } from "@/actions/favorite/add";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useFavorites from "@/hooks/useFavorites";
import React, { useCallback, useMemo } from "react";
import { FaPlus, FaCheck } from "react-icons/fa";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { mutate: mutateFavorites } = useFavorites(movieId);
  const { data: currentProfil, mutate } = useCurrentProfil();

  const isFavorite = useMemo(() => {
    const list = currentProfil?.favoriteIds || [];

    return list.includes(movieId);
  }, [currentProfil, movieId]);

  const toggleFavorites = useCallback(async () => {
    let updatedFavoriteIds;

    if (isFavorite) {
      remove({ movieId });
    } else {
      add({ movieId });
    }

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
      className="flex items-center justify-center w-8 h-8 transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
    >
      <Icon className="text-white " size={20} />
    </div>
  );
};

export default FavoriteButton;
