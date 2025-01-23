"use client";
import React, { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateWatchTime } from "@/actions/watch/update-watch-time";
import usePlaylist from "@/hooks/playlists/usePlaylist";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const Watch = () => {
  const playlistId = useParams<{ playlistId: string }>().playlistId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data: playlist } = usePlaylist(playlistId as string);
  const [currentMovie, setCurrentMovie] = useState<number>(0);

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    const movieId = playlist?.movies[currentMovie].id;
    updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) });
  }

  const updateMovie = (dir: number) => {
    if (
      currentMovie + dir != 0 ||
      currentMovie + dir > playlist?.movies.lenght - 1
    ) {
    }
    setCurrentMovie(currentMovie + dir);
  };

  const handleVideoEnded = () => {
    setMovieWatchTime();
    updateMovie(1);
  };

  return (
    <>
      <div className="w-screen h-screen bg-black relative">
        <nav className="fixed z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
          <FaArrowLeft
            className="text-white cursor-pointer"
            size={40}
            onClick={() => {
              setMovieWatchTime();
              router.push("/playlists");
            }}
          />
          <p className="font-bold text-white text-xl xl:text-3xl flex flex-row">
            <span className="pr-3 font-light">Watching: </span>
            {playlist?.movies[currentMovie].title}
          </p>
        </nav>
        {currentMovie == 0 && (
          <p className="fixed z-10 -right-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tl-xl rounded-bl-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white">
            <FaArrowRight
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
              size={45}
              onClick={() => updateMovie(1)}
            />
            <FaArrowRight
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
              size={26}
              onClick={() => updateMovie(1)}
            />
          </p>
        )}
        {currentMovie > 0 && currentMovie < playlist?.movies.length - 1 && (
          <>
            <p className="fixed z-10 -right-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tl-xl rounded-bl-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white">
              <FaArrowRight
                className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
                size={45}
                onClick={() => updateMovie(1)}
              />
              <FaArrowRight
                className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
                size={26}
                onClick={() => updateMovie(1)}
              />
            </p>
            <p className="fixed z-10 -left-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tr-xl rounded-br-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white">
              <FaArrowLeft
                className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
                size={45}
                onClick={() => updateMovie(-1)}
              />
              <FaArrowLeft
                className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
                size={26}
                onClick={() => updateMovie(-1)}
              />
            </p>
          </>
        )}
        {currentMovie == playlist?.movies.length - 1 && (
          <p className="fixed z-10 -left-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tr-xl rounded-br-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white">
            <FaArrowLeft
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
              size={45}
              onClick={() => updateMovie(-1)}
            />
            <FaArrowLeft
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
              size={26}
              onClick={() => updateMovie(-1)}
            />
          </p>
        )}
        <video
          id="videoElement"
          controls
          autoPlay
          className="w-full h-full"
          src={playlist?.movies[currentMovie].videoUrl}
          ref={videoRef}
          onEnded={handleVideoEnded}
        ></video>
      </div>
    </>
  );
};

export default Watch;
