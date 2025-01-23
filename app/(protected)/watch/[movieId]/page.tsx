"use client";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useRef } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

import { updateWatchTime } from '@/actions/watch/update-watch-time';
import useMovie from '@/hooks/movies/useMovie';

const Watch = () => {
  const movieId = useParams<{ movieId: string }>().movieId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data } = useMovie(movieId);

  const searchParams = useSearchParams();

  const search = searchParams.get("start");

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) });
  }

  let watchTime = data?.watchTime;
  if (search) {
    watchTime = 0;
  }
  const videoURL = data?.videoUrl + "#t=" + watchTime;

  return (
    <div className="w-screen h-screen bg-black">
      <nav className="fixed z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
        <FaArrowLeft
          className="text-white cursor-pointer"
          size={40}
          onClick={() => {
            setMovieWatchTime();
            router.push("/");
          }}
        />
        <p className="font-bold text-white text-xl xl:text-3xl flex flex-row">
          <span className="pr-3 font-light">Watching: </span>
          {data?.title}
        </p>
      </nav>
      <video
        id="videoElement"
        autoPlay
        controls
        className="w-full h-full"
        src={videoURL}
        ref={videoRef}
      >
        <track kind="captions"></track>
      </video>
    </div>
  );
};

export default Watch;
