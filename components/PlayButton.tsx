import React from "react";
import { FaPlay } from "react-icons/fa";
import { useRouter } from "next/router";

interface PlayButtonProps {
  movieId: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ movieId }) => {
  const router = useRouter();
  return (
    <div
      className="flex flex-row items-center px-2 py-3 text-xs font-semibold transition bg-white rounded-md cursor-pointer md:py-3 md:px-4 ld:text-lg hover:bg-neutral-300 min-h-10"
      onClick={() => router.push(`/watch/${movieId}`)}
    >
      <FaPlay size={20} className="mr-2" /> Play
    </div>
  );
};

export default PlayButton;
