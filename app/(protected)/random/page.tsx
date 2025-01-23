"use client";
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';

import { updateWatchTime } from '@/actions/watch/update-watch-time';
import useRandom from '@/hooks/useRandom';

export default function RandomPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data: movie } = useRandom();

  if (movie == undefined) {
    return null;
  }

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    updateWatchTime({
      movieId: movie?.id,
      watchTime: Math.round(video.currentTime),
    });
  }

  return (
    <div className="w-screen h-screen bg-black">
      <nav className="fixed z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
        <AiOutlineArrowLeft
          className="text-white cursor-pointer"
          size={40}
          onClick={() => {
            setMovieWatchTime();
            router.push("/");
          }}
        />
        <p className="font-bold text-white text-1xl md:text-3xl">
          <span className="pr-3 font-light">Watching:</span>
          {movie?.title}
        </p>
      </nav>
      <video
        id="videoElement"
        autoPlay
        controls
        className="w-full h-full"
        src={movie?.videoUrl}
        ref={videoRef}
      >
        <track kind="captions"></track>
      </video>
    </div>
  );
}
