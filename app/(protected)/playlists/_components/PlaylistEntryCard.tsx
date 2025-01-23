"use client";

import Image from "next/image";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaTrashAlt,
} from "react-icons/fa";

interface PlaylistEntryCardProps {
  index: number;
  size: number;
  movie: any;
  onMove: any;
  onClickDelete: any;
}

const PlaylistEntryCard: React.FC<PlaylistEntryCardProps> = ({
  index,
  size,
  movie,
  onMove,
  onClickDelete,
}) => {
  return (
    <div className="relative w-full">
      <Image src={movie.thumbnailUrl} alt="" width={1920} height={1080} />
      {size == 1 && <></>}
      {size == 2 && index == 0 && (
        <>
          <FaArrowRight
            className="absolute z-10 text-white transition-all ease-in cursor-pointer right-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("down", index)}
          />
        </>
      )}
      {size == 2 && index == 1 && (
        <>
          <FaArrowLeft
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("up", index)}
          />
        </>
      )}
      {size > 2 && (index + 1) % 4 == 3 && (
        <>
          <FaArrowUp
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-0 right-0 mx-auto top-1 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("up", index)}
          />
          <FaArrowRight
            className="absolute z-10 text-white transition-all ease-in cursor-pointer right-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("down", index)}
          />
        </>
      )}
      {size > 2 && (index + 1) % 4 == 2 && (
        <>
          <FaArrowLeft
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("up", index)}
          />
          <FaArrowDown
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-0 right-0 mx-auto bottom-1 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("down", index)}
          />
        </>
      )}
      {size > 2 && (index + 1) % 4 == 1 && (
        <>
          <FaArrowUp
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-0 right-0 mx-auto top-1 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("up", index)}
          />
          <FaArrowRight
            className="absolute z-10 text-white transition-all ease-in cursor-pointer right-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("down", index)}
          />
        </>
      )}
      {size > 2 && (index + 1) % 4 == 0 && (
        <>
          <FaArrowLeft
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-1 my-auto top-0 bottom-0 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("up", index)}
          />
          <FaArrowDown
            className="absolute z-10 text-white transition-all ease-in cursor-pointer left-0 right-0 mx-auto bottom-1 hover:text-neutral-300"
            size={18}
            onClick={() => onMove("down", index)}
          />
        </>
      )}
      <FaTrashAlt
        className="absolute z-10 text-red-600 transition-all ease-in cursor-pointer right-1 bottom-1 hover:text-red-400"
        size={18}
        onClick={() => onClickDelete(movie.id)}
      />
    </div>
  );
};
export default PlaylistEntryCard;
