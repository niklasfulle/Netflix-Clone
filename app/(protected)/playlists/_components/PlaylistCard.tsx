import Image from "next/image";
import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";
import { FaPen, FaPlay, FaTrashAlt } from "react-icons/fa";

import { removePlaylist } from "@/actions/playlist/remove-playlist";

interface PlaylistCardProps {
  data: Record<string, any>;
  isLoading: boolean;
  openModalEdit: any;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  data,
  isLoading,
  openModalEdit,
}) => {
  const onCLickDelete = (playlistId: string) => {
    removePlaylist(playlistId).then((data) => {
      if (data?.error) {
        toast.error(data?.error);
      }

      if (data?.success) {
        toast.success(data?.success);
        location.reload();
      }
    });
  };

  return (
    <div className="relative group bg-zinc-800 col-span flex flex-row items-center justify-center rounded-t-md cursor-pointer">
      {(isLoading || data.movies.length == 0) && (
        <div className="flex items-center justify-center w-full h-full p-12 transition shadow-xl cursor-pointer oobject-cover duration rounded-t-md bg-zinc-800">
          <h1 className="absolute top-0 text-2xl text-white font-bold">
            {data.title}
          </h1>
          <svg
            className="w-10 h-10 text-zinc-500 "
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
          <FaTrashAlt
            className="absolute z-10 text-red-500 transition-all ease-in cursor-pointer right-12 bottom-2 hover:text-red-400"
            size={18}
            onClick={() => onCLickDelete(data.id)}
          />
          <FaPen
            className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 bottom-2 hover:text-neutral-400"
            size={18}
            onClick={() => openModalEdit(data.id)}
          />
        </div>
      )}
      {data.movies.length > 0 && data.movies.length < 4 && (
        <>
          <h1 className="absolute top-0 xl:text-2xl text-xl text-white font-bold">
            {data.title}
          </h1>
          <Image
            className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md w-full h-[24vw] lg:h-[12vw]"
            src={data.movies[0]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Link href={`/watch/playlist/${data.id}`} className="hidden md:block">
            <FaPlay
              className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
              size={40}
            />
          </Link>
          <Link href={`/watch/playlist/${data.id}`} className="md:hidden block">
            <FaPlay
              className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
              size={20}
            />
          </Link>
          <FaTrashAlt
            className="absolute z-10 text-red-600 transition-all ease-in cursor-pointer right-12 bottom-2 hover:text-red-400"
            size={18}
            onClick={() => onCLickDelete(data.id)}
          />
          <FaPen
            className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 bottom-2 hover:text-neutral-400"
            size={18}
            onClick={() => openModalEdit(data.id)}
          />
        </>
      )}
      {data.movies.length >= 4 && (
        <>
          <div className="grid grid-cols-2 shadow-xl w-full rounded-t-md relative">
            <Image
              className="cursor-pointer object-cover transition duration rounded-tl-md w-full h-[12vw] lg:h-[6vw]"
              src={data.movies[0]?.thumbnailUrl}
              alt="Thumbnail"
              width={1920}
              height={1080}
              priority
            />
            <Image
              className="cursor-pointer object-cover transition duration rounded-tr-md w-full h-[12vw] lg:h-[6vw]"
              src={data.movies[1]?.thumbnailUrl}
              alt="Thumbnail"
              width={1920}
              height={1080}
              priority
            />
            <Image
              className="cursor-pointer object-cover transition duration w-full h-[12vw] lg:h-[6vw]"
              src={data.movies[2]?.thumbnailUrl}
              alt="Thumbnail"
              width={1920}
              height={1080}
              priority
            />
            <Image
              className="cursor-pointer object-cover transition duration w-full h-[12vw] lg:h-[6vw]"
              src={data.movies[3]?.thumbnailUrl}
              alt="Thumbnail"
              width={1920}
              height={1080}
              priority
            />
            <Link
              href={`/watch/playlist/${data.id}`}
              className="hidden md:block"
            >
              <FaPlay
                className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
                size={40}
              />
            </Link>
            <Link
              href={`/watch/playlist/${data.id}`}
              className="md:hidden block"
            >
              <FaPlay
                className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
                size={20}
              />
            </Link>
            <FaTrashAlt
              className="absolute z-10 text-red-500 transition-all ease-in cursor-pointer right-12 bottom-2 hover:text-red-400"
              size={18}
              onClick={() => onCLickDelete(data.id)}
            />
            <FaPen
              className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 bottom-2 hover:text-neutral-400"
              size={18}
              onClick={() => openModalEdit(data.id)}
            />
          </div>
          <h1 className="absolute top-0 xl:text-2xl text-xl text-white font-bold">
            {data.title}
          </h1>
        </>
      )}
    </div>
  );
};

export default PlaylistCard;
