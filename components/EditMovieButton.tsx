import Link from "next/link";
import React from "react";
import { FaPen } from "react-icons/fa";

interface EditMovieButtonProps {
  movieId: string;
}

const EditMovieButton: React.FC<EditMovieButtonProps> = ({ movieId }) => {
  return (
    <Link href={`/edit_movie/${movieId}`}>
      <div className="flex items-center justify-center h-10 w-10 sm:w-10 lg:p-1 transition border-2 border-white rounded-full cursor-pointer group/item  hover:border-neutral-300">
        <FaPen size={18} className="mt-0.5 text-white" />
      </div>
    </Link>
  );
};

export default EditMovieButton;
