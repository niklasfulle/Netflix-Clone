import React from "react";
import { FaPlay } from "react-icons/fa";
import Link from "next/link";

interface PlayButtonProps {
  movieId: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ movieId }) => {
  return (
    <Link href={`/watch/${movieId}`}>
      <div className="flex flex-row items-center px-2 text-xs font-semibold transition bg-white rounded-md cursor-pointer md:py-3 md:px-4 ld:text-lg hover:bg-neutral-300 min-h-10">
        <FaPlay size={20} className="mr-2" /> Play
      </div>
    </Link>
  );
};

export default PlayButton;
