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
import { useState } from "react";
import useGetActorsCount from "@/hooks/movies/useGetActorsCount";

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
  const [limit, setLimit] = useState(3);
  const { data: newMovies = [] } = useNewMovieList2();
  const { data: actorsCount } = useGetActorsCount();
  const { data: actors = [] } = useGetActors(limit);
  const { data: profil } = useCurrentProfil();
  const { isOpen, closeModal } = useInfoModal();

  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  const loadMore = () => {
    setLimit(limit + 5);
  };

  return (
    <>
      <Head>
        <title>Netflix - Movies</title>
        <meta property="og:title" content="Netflix - Movies" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <BillboardMovie />
      <div>
        <MovieList title="New" data={newMovies} />
        {actors.map((actor: string) => (
          <FilterRowMovies key={actor} title={actor} />
        ))}
        {limit < actorsCount && (
          <div className="flex flex-row items-center justify-center w-full h-8 pt-12 pb-28">
            <button
              onClick={() => loadMore()}
              type="button"
              className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md cursor-pointer hover:bg-red-700 max-w-32"
            >
              Load more
            </button>
          </div>
        )}
        {limit >= actorsCount && (
          <div className="flex flex-row items-center justify-center w-full h-8 pb-20"></div>
        )}
      </div>
    </>
  );
}
