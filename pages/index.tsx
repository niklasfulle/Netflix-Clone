import { Metadata, NextPageContext } from "next";
import { getSession } from "next-auth/react";

import Navbar from "@/components/Navbar";
import Row from "@/components/Row";
import Billboard from "@/components/Billboard";
import MovieList from "@/components/MovieList";
import useMovieList from "@/hooks/movies/useMovieList";
import useFavorites from "@/hooks/useFavorites";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useNewMovieList from "@/hooks/movies/useNewMovieList";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import useSeriesList from "@/hooks/series/useSeriesList";
import Head from "next/head";

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
      },
    };
  }

  return {
    props: {},
  };
}

export default function Home() {
  const { data: newMovies = [] } = useNewMovieList();
  const { data: movies = [] } = useMovieList();
  const { data: series = [] } = useSeriesList();
  const { data: favoriteMovies = [] } = useFavorites();
  const { data: profil } = useCurrentProfil();
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <Head>
        <title>Netflix - Home</title>
        <meta property="og:title" content="Netflix - Home" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
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
