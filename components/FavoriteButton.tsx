import React, { useCallback, useMemo } from 'react';
import { FaCheck, FaPlus } from 'react-icons/fa';

import { add } from '@/actions/favorite/add';
import { remove } from '@/actions/favorite/remove';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useFavorites from '@/hooks/useFavorites';

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

  const toggleFavorites = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentFavoriteIds = currentProfil?.favoriteIds || [];
    let updatedFavoriteIds;

    if (isFavorite) {
      // Entferne movieId aus der Liste
      updatedFavoriteIds = currentFavoriteIds.filter((id: string) => id !== movieId);
      remove({ movieId });
    } else {
      // Füge movieId zur Liste hinzu
      updatedFavoriteIds = [...currentFavoriteIds, movieId];
      add({ movieId });
    }

    // Optimistic Update - aktualisiert sofort im UI
    mutate({
      ...currentProfil,
      favoriteIds: updatedFavoriteIds,
    }, false); // false = kein revalidate

    mutateFavorites();
  }, [movieId, isFavorite, currentProfil, mutate, mutateFavorites]);

  const Icon = isFavorite ? FaCheck : FaPlus;

  return (
    <button
      onClick={toggleFavorites}
      className="flex items-center justify-center h-10 w-10 lg:p-1 transition border-2 border-white rounded-full cursor-pointer group/item hover:border-neutral-300"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Icon className="text-white" size={20} />
    </button>
  );
};

export default FavoriteButton;