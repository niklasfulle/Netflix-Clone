import { NextPageContext } from "next";
import { getSession } from "next-auth/react";

import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import SearchList from "@/components/SearchList";
import useFavorites from "@/hooks/useFavorites";
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
  const { data: profil } = useCurrentProfil();
  const { data: favoriteMovies = [] } = useFavorites();
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (favoriteMovies == undefined || profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <Head>
        <title>Netflix - My List</title>
        <meta property="og:title" content="Netflix - My List" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
      </Head>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="pt-40 pb-40">
        <SearchList title="My List" data={favoriteMovies} />
      </div>
    </>
  );
}
