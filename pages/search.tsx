import { NextPageContext } from "next";
import { getSession } from "next-auth/react";

import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import useSearchItem from "@/hooks/useSearchItem";
import SearchList from "@/components/SearchList";
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
  const searchParams = useSearchParams();
  const { data: profil } = useCurrentProfil();
  const { data: results } = useSearchItem(searchParams.get("item") as string);
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (results == undefined || profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <Head>
        <title>Netflix - Search</title>
        <meta property="og:title" content="Netflix - Search" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
      </Head>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="pt-40 pb-40">
        <SearchList title="Search Result" data={results} />
      </div>
    </>
  );
}
