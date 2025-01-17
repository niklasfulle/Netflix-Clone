"use client";
import React, { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiOutlineArrowLeft } from "react-icons/ai";
import useMovie from "@/hooks/movies/useMovie";
import { useSearchParams } from "next/navigation";
import { updateWatchTime } from "@/actions/watch/update-watch-time";

const Watch = () => {
  const movieId = useParams<{ movieId: string }>().movieId;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { data } = useMovie(movieId as string);

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
    <>
      <header>
        <title>Netflix</title>
        <meta property="og:title" content="Netflix" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
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
        ></video>
      </div>
    </>
  );
};

export default Watch;
