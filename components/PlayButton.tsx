import React from "react";
import { BsFillPlayFill } from "react-icons/Bs";
import { useRouter } from "next/router";

interface PlayButtonProps {
  movieId: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ movieId }) => {
  const router = useRouter();
  return (
    <div
      className="flex flex-row items-center px-2 py-1 text-xs font-semibold transition bg-white rounded-md cursor-pointer md:py-2 md:px-4 ld:text-lg hover:bg-neutral-300"
      onClick={() => router.push(`/watch/${movieId}`)}
    >
      <BsFillPlayFill size={30} /> Play
    </div>
  );
};

export default PlayButton;
