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

export default function Home() {
  const { isOpen, closeModal } = useInfoModal();
  const { data: newMovies = [] } = useNewMovieList();
  const { data: movies = [] } = useMovieList();
  const { data: series = [] } = useSeriesList();
  const { data: favoriteMovies = [] } = useFavorites();

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <Billboard />
      <div className="pb-40">
        <MovieList title="New" data={newMovies} />
        <Row title="Movies" data={movies} />
        <Row title="Series" data={series} />
        <Row title="Favorites" data={favoriteMovies} />
      </div>
    </>
  );
}
