import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { AiOutlineArrowLeft } from "react-icons/ai";

import useMovie from "@/hooks/movies/useMovie";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Head from "next/head";

const Watch = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);

  const searchParams = useSearchParams();

  const search = searchParams.get("start");

  async function setMovieWatchTime() {
    const video = document.getElementById("videoElement") as HTMLVideoElement;
    try {
      await axios.post("/api/updateMovieWatchTime", {
        movieId,
        watchTime: Math.round(video.currentTime),
      });
    } catch (error) {
      console.log(error);
    }
  }

  let watchTime = data?.watchTime;
  if (search) {
    watchTime = 0;
  }
  const videoURL = data?.videoUrl + "#t=" + watchTime;

  return (
    <>
      <Head>
        <title>Netflix - {data?.title}</title>
      </Head>
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
