import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import useNewSeriesList from "@/hooks/series/useNewSeriesList";
import MovieList from "@/components/MovieList";
import BillboardSeries from "@/components/BillboardSeries";
import FilterRowSeries from "@/components/FilterRowSeries";
import useGetActors from "@/hooks/series/useGetActors";
import Head from "next/head"; // Ensure this path is correct
import { useState } from "react";
import useGetActorsCount from "@/hooks/series/useGetActorsCount";

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
  const { data: newSeries = [] } = useNewSeriesList();
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
        <title>Netflix - Series</title>
        <meta property="og:title" content="Netflix - Series" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <BillboardSeries />
      <div>
        <MovieList title="New" data={newSeries} />
        {actors.map((actor: string) => (
          <FilterRowSeries key={actor} title={actor} />
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
