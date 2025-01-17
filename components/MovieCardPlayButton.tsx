import React from "react";
import { FaPlay } from "react-icons/fa";
import Link from "next/link";

interface PlayButtonProps {
  movieId: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ movieId }) => {
  return (
    <Link href={`/watch/${movieId}`}>
      <div className="flex flex-row items-center p-1 xl:p-2 h-10 w-10 xl:w-auto justify-center text-md font-semibold transition bg-white rounded-full xl:rounded-md cursor-pointer xl:text-lg hover:bg-neutral-400">
        <FaPlay size={20} className="m-1 xl:m-0 xl:mr-2 mr-0.5" />
        <p className="hidden xl:block">Play</p>
      </div>
    </Link>
  );
};

export default PlayButton;
