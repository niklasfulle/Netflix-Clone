"use client";
import Billboard from '@/components/Billboard';
import Footer from '@/components/Footer';
import InfoModal from '@/components/InfoModal';
import MovieList from '@/components/MovieList';
import Navbar from '@/components/Navbar';
import Row from '@/components/Row';
import useRandomMovieList from '@/hooks/movies/useRandomMovieList';
import useNewMovieList from '@/hooks/movies/useNewMovieList';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useRandomSeriesList from '@/hooks/series/useRandomSeriesList';
import useFavorites from '@/hooks/useFavorites';
import useInfoModal from '@/hooks/useInfoModal';
import useContinueWatching from '@/hooks/useContinueWatching';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();
  const { isOpen, closeModal } = useInfoModal();
  const { data: newMovies = [], isLoading: isLoadingNewMovieList } =
    useNewMovieList();
  const { data: movies = [], isLoading: isLoadingMovieList } = useRandomMovieList();
  const { data: series = [], isLoading: isLoadingSeriesList } = useRandomSeriesList();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
  const { data: playlists } = usePlaylists();
  const {
    data: continueWatching = [],
    isLoading: isLoadingContinueWatching,
  } = useContinueWatching();

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} playlists={playlists} />
      <Navbar />
      <Billboard />
      <div className="pb-12 min-h-screen">
        <MovieList
          title={t('Continue Watching')}
          data={continueWatching}
          isLoading={isLoadingContinueWatching}
        />
        <MovieList
          title={t('New')}
          data={newMovies}
          isLoading={isLoadingNewMovieList}
        />
        <Row title={t('Movies')} data={movies} isLoading={isLoadingMovieList} />
        <Row title={t('Series')} data={series} isLoading={isLoadingSeriesList} />
        <Row
          title={t('Favorites')}
          data={favoriteMovies}
          isLoading={isLoadingFavorites}
        />
      </div>
      <Footer />
    </>
  );
}
