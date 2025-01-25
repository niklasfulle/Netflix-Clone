import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";
import { FaPen, FaPlay, FaTrashAlt } from "react-icons/fa";

import { removePlaylist } from "@/actions/playlist/remove-playlist";
import PlaylistCover from "./PlaylistCover";

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
        <div className="flex items-center justify-center w-full h-full p-10 transition shadow-xl cursor-pointer oobject-cover duration rounded-t-md bg-zinc-800">
          <h1 className="absolute top-0 text-2xl text-white font-bold">
            {data.title}
          </h1>
          <PlaylistCover movies={data.movies} />
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
          <PlaylistCover movies={data.movies} />
          <Link href={`/watch/playlist/${data.id}`} className="hidden md:block">
            <FaPlay
              className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
              size={40}
            />
          </Link>
          <Link href={`/watch/playlist/${data.id}`} className="md:hidden block">
            <FaPlay
              className="absolute text-white hover:text-neutral-300 m-auto left-0 right-0 top-0 bottom-0"
              size={30}
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
            <PlaylistCover movies={data.movies} />
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
                size={30}
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
