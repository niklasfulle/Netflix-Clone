import React from "react";
import { FaChevronDown, FaPlay, FaUndo } from "react-icons/fa";
import FavoriteButton from "./FavoriteButton";
import { useRouter } from "next/router";
import useInfoModal from "@/hooks/useInfoModal";
import Image from "next/image";

interface MovieCardProps {
  data: Record<string, any>;
}

function calculateBarWidth(duration: string, watchTime: number): any {
  let i: string[] = duration.split(":");
  let sec: number;
  if (i.length == 1) {
    sec = parseInt(i[0]);
  } else if (i.length == 2) {
    sec = parseInt(i[0]) * 60 + parseInt(i[1]);
  } else if (i.length == 3) {
    sec = parseInt(i[0]) * 60 * 60 + parseInt(i[1]) * 60 + parseInt(i[2]);
  }

  return Math.floor(watchTime / (sec! / 100));
}

const MovieCard: React.FC<MovieCardProps> = ({ data }) => {
  const router = useRouter();

  let barWidth: any = calculateBarWidth(data?.duration, data?.watchTime) + "%";
  const { openModal } = useInfoModal();

  return (
    <div className="group bg-zinc-900 col-span relative h-[20vw] lg:h-[12vw]">
      <div className="relative rounded-md">
        <Image
          className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md group-hover:opacity-90 sm:group-hover:opacity-0 w-full h-[20vw] lg:h-[12vw]"
          src={data.thumbnailUrl}
          alt="Thumbnail"
          width={1920}
          height={1080}
        />
        {data.watchTime != undefined && (
          <>
            <div
              className="absolute z-10 h-1 bg-red-600 group-hover:hidden"
              style={{
                width: barWidth,
              }}
            ></div>
            <div className="absolute w-full h-1 bg-black group-hover:hidden"></div>
          </>
        )}
      </div>
      <div className="z-50 opacity-0 absolute top-0 transition duration-200 scale-0 group-hover:scale-100 group-hover:-translate-y-[6vw] min-w-2/3 lg:w-full group-hover:opacity-100">
        <Image
          onClick={() => openModal(data?.id)}
          className="cursor-pointer object-cover aspect-video transition duration shadow-xl rounded-t-md min-w-2/3 lg:w-full h-[20vw] lg:h-[12vw]"
          src={data.thumbnailUrl}
          alt="Thumbnail2"
          width={1920}
          height={1080}
        />
        <div className="absolute z-10 w-full p-2 transition shadow-md max-h-52 lg:h-auto bg-zinc-800 lg:p-4 rounded-b-md">
          <div className="flex flex-row items-center gap-3">
            <div className="flex flex-row gap-2">
              <div
                className="flex items-center justify-center w-8 h-8 transition bg-white rounded-full cursor-pointer lg:w-10 lg:h-10 hover:bg-neutral-300"
                onClick={() => router.push(`/watch/${data?.id}`)}
              >
                <FaPlay className="ml-1" size={20} />
              </div>
              <div
                className="flex items-center justify-center w-8 h-8 pl-0.5 transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
                onClick={() => router.push(`/watch/${data?.id}?start=0`)}
              >
                <FaUndo size={18} className="mt-0.5 text-white" />
              </div>
              <FavoriteButton movieId={data?.id} />
            </div>
            <div
              onClick={() => openModal(data?.id)}
              className="flex items-center justify-center w-8 h-8 ml-auto transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
            >
              <FaChevronDown
                className="text-white group-hover/item:text-neutral-300 mt-0.5"
                size={20}
              />
            </div>
          </div>
          <p className="hidden mt-4 font-semibold text-green-400 lg:block">
            New <span className="ml-4 text-white">{data.title}</span>
          </p>
          <p className="block mt-2 font-semibold text-white lg:hidden">
            {data.title}
          </p>
          <div className="flex flex-col pb-4 mt-4 md:gap-8 md:flex-row ">
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
