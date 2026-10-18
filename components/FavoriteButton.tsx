import React, { useCallback, useMemo, useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useSWRConfig } from 'swr';
import { toast } from 'react-hot-toast';

import { add } from '@/actions/favorite/add';
import { remove } from '@/actions/favorite/remove';
import { useLanguage } from '@/components/providers/LanguageProvider';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import useFavorites from '@/hooks/useFavorites';
import { FAVORITES_PLAYLIST_ID } from '@/lib/playlists';

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { mutate: mutateFavorites } = useFavorites();
  const { data: currentProfil, mutate } = useCurrentProfil();
  const { t } = useLanguage();
  const { mutate: revalidate } = useSWRConfig();
  const [isUpdating, setIsUpdating] = useState(false);

  const isFavorite = useMemo(() => {
    const list = currentProfil?.favoriteIds || [];

    return list.includes(movieId);
  }, [currentProfil, movieId]);

  const toggleFavorites = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProfil || isUpdating) return;
    
    const currentFavoriteIds = currentProfil.favoriteIds || [];
    const updatedFavoriteIds = isFavorite
      ? currentFavoriteIds.filter((id: string) => id !== movieId)
      : [...currentFavoriteIds, movieId];
    setIsUpdating(true);

    // Optimistic Update - aktualisiert sofort im UI
    mutate({
      ...currentProfil,
      favoriteIds: updatedFavoriteIds,
    }, false); // false = kein revalidate

    try {
      const result = await (isFavorite ? remove({ movieId }) : add({ movieId }));
      if (result?.error) throw new Error(result.error);
      await Promise.allSettled([
        mutateFavorites(),
        revalidate('/api/playlist'),
        revalidate(`/api/playlist/${FAVORITES_PLAYLIST_ID}`),
      ]);
    } catch {
      mutate(currentProfil, false);
      toast.error(t('Favorites could not be updated. Please try again.'));
    } finally {
      setIsUpdating(false);
    }
  }, [movieId, isFavorite, currentProfil, mutate, mutateFavorites, revalidate, isUpdating, t]);

  const Icon = isFavorite ? FaHeart : FaRegHeart;

  return (
    <button
      type="button"
      onClick={toggleFavorites}
      disabled={isUpdating}
      aria-busy={isUpdating}
      className="flex items-center justify-center h-10 w-10 lg:p-1 transition border-2 border-white rounded-full cursor-pointer group/item hover:border-neutral-300"
      aria-label={isFavorite ? t('Remove from favorites') : t('Add to favorites')}
      aria-pressed={isFavorite}
    >
      <Icon className={isFavorite ? "text-red-500" : "text-white"} size={20} />
    </button>
  );
};

export default FavoriteButton;
