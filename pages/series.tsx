import { NextPageContext } from "next";
import { getSession } from "next-auth/react";

import Navbar from "@/components/Navbar";
import Billboard from "@/components/Billboard";
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
  const { data: newSeries = [] } = useNewSeriesList();
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
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <BillboardSeries />
      <div className="pb-40">
        <MovieList title="New" data={newSeries} />
        {actors.map((actor: string) => (
          <FilterRowSeries key={actor} title={actor} />
        ))}
      </div>
    </>
  );
}
