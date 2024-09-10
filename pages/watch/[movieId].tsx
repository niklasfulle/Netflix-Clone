import React, { useRef } from "react";
import { useRouter } from "next/router";
import { AiOutlineArrowLeft } from "react-icons/ai";

import useMovie from "@/hooks/movies/useMovie";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useCurrentUser from "@/hooks/useCurrentUser";
import axios from "axios";

const Watch = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const { movieId } = router.query;
  const { data } = useMovie(movieId as string);

  async function setMovieWatchTime() {
    const video = document.getElementById("test") as HTMLVideoElement;
    try {
      await axios.post("/api/updateMovieWatchTime", {
        movieId,
        watchTime: Math.round(video.currentTime),
      });
    } catch (error) {
      console.log(error);
    }
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
          {data?.title}
        </p>
      </nav>
      <video
        id="test"
        autoPlay
        controls
        className="w-full h-full"
        src={data?.videoUrl}
        ref={videoRef}
      ></video>
    </div>
  );
};

export default Watch;
