import { NextPageContext } from "next";
import { getSession } from "next-auth/react";

import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import useNewMovieList2 from "@/hooks/movies/useNewMovieList2";
import MovieList from "@/components/MovieList";
import BillboardMovie from "@/components/BillboardMovie";
import FilterRowMovies from "@/components/FilterRowMovies";
import useGetActors from "@/hooks/movies/useGetActors";
import Head from "next/head";

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Home() {
  const { data: newMovies = [] } = useNewMovieList2();
  const { data: actors = [] } = useGetActors();
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
        <title>Netflix - Movies</title>
        <meta property="og:title" content="Netflix - Movies" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
      </Head>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <BillboardMovie />
      <div className="pb-40">
        <MovieList title="New" data={newMovies} />
        {actors.map((actor: string) => (
          <FilterRowMovies key={actor} title={actor} />
        ))}
      </div>
    </>
  );
}
