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

export default function Home() {
  const { isOpen, closeModal } = useInfoModal();
  const { data: newMovies = [], isLoading: isLoadingNewMovieList } =
    useNewMovieList();
  const { data: movies = [], isLoading: isLoadingMovieList } = useRandomMovieList();
  const { data: series = [], isLoading: isLoadingSeriesList } = useRandomSeriesList();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
  const { data: playlists } = usePlaylists();

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} playlists={playlists} />
      <Navbar />
      <Billboard />
      <div className="pb-12 min-h-screen">
        <MovieList
          title="New"
          data={newMovies}
          isLoading={isLoadingNewMovieList}
        />
        <Row title="Movies" data={movies} isLoading={isLoadingMovieList} />
        <Row title="Series" data={series} isLoading={isLoadingSeriesList} />
        <Row
          title="Favorites"
          data={favoriteMovies}
          isLoading={isLoadingFavorites}
        />
      </div>
      <Footer />
    </>
  );
}
