"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import { updateWatchTime } from "@/actions/watch/update-watch-time";
import { addMovieView } from "@/actions/watch/add-movie-view";
import { addToWatchlist } from "@/actions/watch/add-to-watchlist";
import usePlaylist from "@/hooks/playlists/usePlaylist";

const Watch = () => {
  const playlistId = useParams<{ playlistId: string }>().playlistId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data: playlist } = usePlaylist(playlistId);
  const [currentMovie, setCurrentMovie] = useState<number>(0);

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    const movieId = playlist?.movies[currentMovie]?.id;
    if (movieId && video) {
      updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) });
    }
  }

  const updateMovie = (dir: number) => {
    if (!playlist?.movies) return;
    const newIndex = currentMovie + dir;
    if (newIndex >= 0 && newIndex < playlist.movies.length) {
      setCurrentMovie(newIndex);
    }
  };

  React.useEffect(() => {
    const movieId = playlist?.movies?.[currentMovie]?.id;
    if (movieId) {
      addMovieView({ movieId });
      addToWatchlist({ movieId });
    }
  }, [currentMovie, playlist]);

  const handleVideoEnded = () => {
    setMovieWatchTime();
    updateMovie(1);
  };

  const hasMultiple = playlist?.movies?.length > 1;
  const current = playlist?.movies?.[currentMovie];

  return (
    <div className="w-screen h-screen bg-black relative">
      <nav className="fixed top-8 sm:top-0 z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
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
          {current?.title}
        </p>
      </nav>
      {hasMultiple && currentMovie === 0 && (
        <button
          onClick={() => updateMovie(1)}
          className="fixed z-10 -right-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tl-xl rounded-bl-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white"
        >
          <FaArrowRight
            className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
            size={45}
          />
          <FaArrowRight
            className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
            size={26}
          />
        </button>
      )}
      {hasMultiple && currentMovie > 0 && currentMovie < playlist.movies.length - 1 && (
        <>
          <button
            className="fixed z-10 -left-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tr-xl rounded-br-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white"
            onClick={() => updateMovie(-1)}
          >
            <FaArrowLeft
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
              size={45}
            />
            <FaArrowLeft
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
              size={26}
            />
          </button>
          <button
            onClick={() => updateMovie(1)}
            className="fixed z-10 -right-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tl-xl rounded-bl-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white"
          >
            <FaArrowRight
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
              size={45}
            />
            <FaArrowRight
              className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
              size={26}
            />
          </button>
        </>
      )}
      {hasMultiple && currentMovie === playlist.movies.length - 1 && (
        <button
          onClick={() => updateMovie(-1)}
          className="fixed z-10 -left-1 bottom-[20%] h-10 w-12 xl:h-16 xl:w-20 bg-black rounded-tr-xl rounded-br-xl cursor-pointer flex flex-row items-center justify-center border-[1px] border-white"
        >
          <FaArrowLeft
            className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 xl:block hidden"
            size={45}
          />
          <FaArrowLeft
            className="absolute z-10 text-white transition-all ease-in cursor-pointer hover:text-neutral-300 block xl:hidden"
            size={26}
          />
        </button>
      )}
      {current?.id && (
        <video
          id="videoElement"
          autoPlay
          controls
          className="w-full h-full"
          ref={videoRef}
          poster={current.thumbnailUrl}
          onTimeUpdate={() => {
            // Auto-save alle 10 Sekunden
            if (videoRef.current && Math.floor(videoRef.current.currentTime) % 10 === 0) {
              setMovieWatchTime();
            }
          }}
          onEnded={handleVideoEnded}
        >
          <source src={`/api/video/${current.id}`} type="video/mp4" />
          <track kind="captions"></track>
        </video>
      )}
    </div>
  );
};

export default Watch;