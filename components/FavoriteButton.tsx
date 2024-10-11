import { remove } from "@/actions/favorite/remove";
import { add } from "@/actions/favorite/add";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useFavorites from "@/hooks/useFavorites";
import axios from "axios";
import React, { useCallback, useMemo, useState } from "react";
import { FaPlus, FaCheck } from "react-icons/fa";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { mutate: mutateFavorites } = useFavorites(movieId);
  const { data: currentProfil, mutate } = useCurrentProfil();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const isFavorite = useMemo(() => {
    const list = currentProfil?.favoriteIds || [];

    return list.includes(movieId);
  }, [currentProfil, movieId]);

  const toggleFavorites = useCallback(async () => {
    let updatedFavoriteIds: any;

    if (isFavorite) {
      remove({ movieId })
        .then((data) => {
          if (data?.error) {
            setError(data?.error);
          }

          if (data?.success) {
            setSuccess(data?.success);
            updatedFavoriteIds = data?.data;
          }
        })
        .catch(() => setError("Something went wrong!"));
    } else {
      add({ movieId })
        .then((data) => {
          if (data?.error) {
            setError(data?.error);
          }

          if (data?.success) {
            setSuccess(data?.success);
            updatedFavoriteIds = data?.data;
          }
        })
        .catch(() => setError("Something went wrong!"));
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
