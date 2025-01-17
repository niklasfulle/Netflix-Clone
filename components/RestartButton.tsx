import React from "react";
import { FaUndo } from "react-icons/fa";
import Link from "next/link";

interface RestartButtonProps {
  movieId: string;
}

const RestartButton: React.FC<RestartButtonProps> = ({ movieId }) => {
  return (
    <Link href={`/watch/${movieId}?start=0`}>
      <div className="flex items-center justify-center h-10 w-10 sm:w-10 lg:p-1 transition border-2 border-white rounded-full cursor-pointer group/item  hover:border-neutral-300">
        <FaUndo size={18} className="mt-0.5 text-white" />
      </div>
    </Link>
  );
};

export default RestartButton;
