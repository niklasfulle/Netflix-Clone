import Image from "next/image";
import React from "react";

interface PlaylistCardProps {
  data: Record<string, any>;
  isLoading: boolean;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ data, isLoading }) => {
  console.log(data);

  return (
    <div className="relative group bg-zinc-800 col-span h-[20vw] lg:h-[12vw] flex flex-row items-center justify-center rounded-t-md cursor-pointer">
      {(isLoading || data.movies.length == 0) && (
        <div className="flex items-center justify-center w-full h-full transition shadow-xl cursor-pointer oobject-cover duration rounded-t-md bg-zinc-800">
          <svg
            className="w-10 h-10 text-zinc-500  group-hover:text-gray-300"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
        </div>
      )}
      {data.movies.length > 0 && data.movies.length < 4 && (
        <Image
          className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md w-full h-[20vw] lg:h-[12vw]"
          src={data.movies[0]?.thumbnailUrl}
          alt="Thumbnail"
          width={1920}
          height={1080}
          priority
        />
      )}
      {data.movies.length >= 4 && (
        <div className="grid grid-cols-2 shadow-xl w-full rounded-t-md">
          <Image
            className="cursor-pointer object-cover transition duration rounded-tl-md w-full h-[10vw] lg:h-[6vw]"
            src={data.movies[0]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration rounded-tr-md w-full h-[10vw] lg:h-[6vw]"
            src={data.movies[1]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration w-full h-[10vw] lg:h-[6vw]"
            src={data.movies[2]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
          <Image
            className="cursor-pointer object-cover transition duration w-full h-[10vw] lg:h-[6vw]"
            src={data.movies[3]?.thumbnailUrl}
            alt="Thumbnail"
            width={1920}
            height={1080}
            priority
          />
        </div>
      )}
    </div>
  );
};

export default PlaylistCard;
