"use client";
import Billboard from '@/components/Billboard';
import Footer from '@/components/Footer';
import InfoModal from '@/components/InfoModal';
import MovieList from '@/components/MovieList';
import Navbar from '@/components/Navbar';
import Row from '@/components/Row';
import useRandomMovieList from '@/hooks/movies/useRandomMovieList';
import useNewMovieList from '@/hooks/movies/useNewMovieList';
import useNewSeriesList from '@/hooks/series/useNewSeriesList';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useRandomSeriesList from '@/hooks/series/useRandomSeriesList';
import useFavorites from '@/hooks/useFavorites';
import useInfoModal from '@/hooks/useInfoModal';
import useContinueWatching from '@/hooks/useContinueWatching';
import { useLanguage } from '@/components/providers/LanguageProvider';

function HomeCatalogSkeleton() {
  const { t } = useLanguage();
  return (
    <div>
      <MovieList title={t('New')} data={[]} isLoading loadingCount={8} />
      <Row title={t('Movies')} data={[]} isLoading />
      <Row title={t('Series')} data={[]} isLoading />
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { isOpen, closeModal } = useInfoModal();
  const { data: newMovies = [], isLoading: isLoadingNewMovieList } =
    useNewMovieList();
  const { data: newSeries = [], isLoading: isLoadingNewSeriesList } =
    useNewSeriesList();
  const newTitles = [...newMovies, ...newSeries]
    .sort((first, second) => (
      new Date(second.createdAt ?? 0).getTime() - new Date(first.createdAt ?? 0).getTime()
    ))
    .slice(0, 8);
  const { data: movies = [], isLoading: isLoadingMovieList } = useRandomMovieList();
  const { data: series = [], isLoading: isLoadingSeriesList } = useRandomSeriesList();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
  const { data: playlists } = usePlaylists();
  const {
    data: continueWatching = [],
    isLoading: isLoadingContinueWatching,
  } = useContinueWatching();
  const isLoadingCatalog = isLoadingNewMovieList || isLoadingNewSeriesList
    || isLoadingMovieList || isLoadingSeriesList || isLoadingFavorites
    || isLoadingContinueWatching;

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} playlists={playlists} />
      <Navbar />
      <Billboard />
      <div className="pb-12 min-h-screen" aria-busy={isLoadingCatalog}>
        {isLoadingCatalog ? (
          <HomeCatalogSkeleton />
        ) : (
          <>
            <MovieList
              title={t('Continue Watching')}
              data={continueWatching}
              isLoading={isLoadingContinueWatching}
            />
            <MovieList
              title={t('New')}
              data={newTitles}
              isLoading={isLoadingNewMovieList || isLoadingNewSeriesList}
            />
            <Row title={t('Movies')} data={movies} isLoading={isLoadingMovieList} />
            <Row title={t('Series')} data={series} isLoading={isLoadingSeriesList} />
            <Row
              title={t('Favorites')}
              data={favoriteMovies}
              isLoading={isLoadingFavorites}
            />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
