"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useRef, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";

import { updateWatchTime } from "@/actions/watch/update-watch-time";
import useMovie from "@/hooks/movies/useMovie";

const Watch = () => {
  const movieId = useParams<{ movieId: string }>().movieId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data } = useMovie(movieId);

  const searchParams = useSearchParams();
  const search = searchParams.get("start");

  async function setMovieWatchTime() {
    const video = videoRef.current;
    if (video) {
      updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) });
    }
  }

  useEffect(() => {
    if (videoRef.current && data?.watchTime && !search) {
      videoRef.current.currentTime = data.watchTime;
    }
  }, [data?.watchTime, search]);

  if (!data) {
    return null;
  }

  return (
    <div className="w-screen h-screen bg-black">
      <nav className="fixed top-8 sm:top-0 z-10 flex flex-row items-center w-full gap-8 p-4 bg-black bg-opacity-70">
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
        ref={videoRef}
        poster={data.thumbnailUrl}
        onTimeUpdate={() => {
          // Auto-save alle 10 Sekunden
          if (videoRef.current && Math.floor(videoRef.current.currentTime) % 10 === 0) {
            setMovieWatchTime();
          }
        }}
      >
        <source src={`/api/video/${movieId}`} type="video/mp4" />
        <track kind="captions"></track>
      </video>
    </div>
  );
};

export default Watch;