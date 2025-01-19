"use client";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import Billboard from "@/components/Billboard";
import Navbar from "@/components/Navbar";
import MovieList from "@/components/MovieList";
import useFavorites from "@/hooks/useFavorites";
import Row from "@/components/Row";
import useNewMovieList from "@/hooks/movies/useNewMovieList";
import useMovieList from "@/hooks/movies/useMovieList";
import useSeriesList from "@/hooks/series/useSeriesList";
import Footer from "@/components/Footer";
import usePlaylists from "@/hooks/playlists/usePlaylists";

export default function Home() {
  const { isOpen, closeModal } = useInfoModal();
  const { data: newMovies = [], isLoading: isLoadingNewMovieList } =
    useNewMovieList();
  const { data: movies = [], isLoading: isLoadingMovieList } = useMovieList();
  const { data: series = [], isLoading: isLoadingSeriesList } = useSeriesList();
  const { data: favoriteMovies = [], isLoading: isLoadingFavorites } =
    useFavorites();
  const { data: playlists } = usePlaylists();

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} playlists={playlists} />
      <Navbar />
      <Billboard />
      <div className="pb-40 min-h-screen">
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
