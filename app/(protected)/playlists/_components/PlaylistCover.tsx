import React from "react";
import { Movie } from "@prisma/client";
import Image from "next/image";

interface PlaylistCoverProps {
  movies: Movie[];
}

const PlaylistCover: React.FC<PlaylistCoverProps> = ({ movies }) => {
  return (
    <>
      {movies.length == 0 && (
        <svg
          className="w-10 h-10 text-zinc-500 "
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 18"
        >
          <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
        </svg>
      )}
      {movies.length > 0 && movies.length < 4 && (
        <Image
          className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md w-full h-[24vw] lg:h-[12vw]"
          src={movies[0]?.thumbnailUrl}
          alt="Thumbnail"
          width={1920}
          height={1080}
          priority
        />
      )}
      {movies.length > 4 && (
        <>
          <Image
            className="cursor-pointer object-cover transition duration rounded-tl-md w-full h-[12vw] lg:h-[6vw]"
            src={movies[0]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration rounded-tr-md w-full h-[12vw] lg:h-[6vw]"
            src={movies[1]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration w-full h-[12vw] lg:h-[6vw]"
            src={movies[2]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration w-full h-[12vw] lg:h-[6vw]"
            src={movies[3]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
        </>
      )}
    </>
  );
};

export default PlaylistCover;
