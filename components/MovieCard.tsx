import React from "react";
import { BsFillPlayFill } from "react-icons/Bs";
import { BiChevronDown } from "react-icons/Bi";
import FavoriteButton from "./FavoriteButton";
import { useRouter } from "next/router";
import useInfoModal from "@/hooks/useInfoModal";
import Image from "next/image";

interface MovieCardProps {
  data: Record<string, any>;
}

const MovieCard: React.FC<MovieCardProps> = ({ data }) => {
  const router = useRouter();

  const { openModal } = useInfoModal();

  return (
    <div className="group bg-zinc-900 col-span relative h-[20vw] lg:h-[12vw]">
      <Image
        className="cursor-pointer object-cover transition duration shadow-xl rounded-md group-hover:opacity-90 sm:group-hover:opacity-0 w-full h-[20vw] lg:h-[12vw]"
        src={data.thumbnailUrl}
        alt="Thumbnail"
        width={1920}
        height={1080}
      />
      <div className="z-10 opacity-0 absolute top-0 transition duration-200 scale-0 group-hover:scale-100 group-hover:-translate-y-[6vw] min-w-2/3 lg:w-full group-hover:opacity-100">
        <Image
          onClick={() => openModal(data?.id)}
          className="cursor-pointer oobject-cover transition duration shadow-xl rounded-t-md min-w-2/3 lg:w-full h-[20vw] lg:h-[12vw]"
          src={data.thumbnailUrl}
          alt="Thumbnail"
          width={1920}
          height={1080}
        />
        <div className="absolute z-10 w-full p-2 transition shadow-md max-h-52 lg:h-auto bg-zinc-800 lg:p-4 rounded-b-md">
          <div className="flex flex-row items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 transition bg-white rounded-full cursor-pointer lg:w-10 lg:h-10 hover:bg-neutral-300"
              onClick={() => router.push(`/watch/${data?.id}`)}
            >
              <BsFillPlayFill size={30} />
            </div>
            <FavoriteButton movieId={data?.id} />
            <div
              onClick={() => openModal(data?.id)}
              className="flex items-center justify-center w-8 h-8 ml-auto transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
            >
              <BiChevronDown
                className="text-white group-hover/item:text-neutral-300"
                size={30}
              />
            </div>
          </div>
          <p className="hidden font-semibold text-green-400 lg:block">
            New <span className="ml-4 text-white">{data.title}</span>
          </p>
          <p className="block mt-2 font-semibold text-white lg:hidden lg:mt-0">
            {data.title}
          </p>
          <div className="flex flex-col pb-4 mt-4 md:gap-8 md:flex-row lg:justify-center lg:items-center">
            <p className="text-white text-[10px] text-base lg:text-sm">
              {data.duration}
            </p>
            <p className="text-white text-[10px] text-base lg:text-sm">
              {data.genre}
            </p>
            <p className="text-white text-[10px] text-base lg:text-sm md:text-center">
              {data.actor}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
