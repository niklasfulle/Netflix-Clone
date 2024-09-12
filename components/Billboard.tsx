"use client";
import useBillboard from "@/hooks/useBillborad";
import React, { useCallback, useEffect, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import PlayButton from "./PlayButton";
import useInfoModal from "@/hooks/useInfoModal";
import Image from "next/image";

const Billboard = () => {
  const { data } = useBillboard();
  const { openModal } = useInfoModal();
  const [isDesktop, setIsDesktop] = useState(true);

  const checkWindowSize = () => {
    let windowWidth: number = 0; // Initialize with a default value
    if (typeof window !== "undefined") {
      windowWidth = window.innerWidth;
    }
    if (windowWidth >= 1024) {
      setIsDesktop(true);
    } else {
      setIsDesktop(false);
    }
  };

  useEffect(() => {
    checkWindowSize();
  }, [isDesktop]);

  const handleOpenModal = useCallback(() => {
    openModal(data?.id);
  }, [openModal, data?.id]);

  return (
    <div className="relative h-[56.25vw]">
      {isDesktop && (
        <video
          className="w-full h-[56.25vw] object-cover brightness-[60%] aspect-video"
          autoPlay
          muted
          loop
          poster={data?.thumbnailUrl}
          src={data?.videoUrl}
        ></video>
      )}
      {!isDesktop && (
        <Image
          className="w-full h-[56.25vw] object-cover brightness-[60%] aspect-video"
          src={data?.thumbnailUrl}
          height={1080}
          width={1920}
          alt="Thumbnail"
        />
      )}
      <div className="absolute top-[50%] md:top-[40%] ml-4 md:ml-16 max-w-[60%]">
        <p className="w-full h-full font-bold text-white text-1xl md:text-5xl lg:text-6xl drop-shadow-xl">
          {data?.title}
        </p>
        {data?.description != "test" && (
          <p className="text-white text-[8px] text-lg mt-3 md:mt-8 w-[90%] md:w-[80%] lg:w-[90%] drop-shadow-xl">
            {data?.description.substring(0, 250)}
            {data?.description.length >= 140 && "..."}
          </p>
        )}
        {data?.description == "test" && <div className="h-10"></div>}
        <div className="flex flex-row items-center gap-3 mt-3 md:mt-4">
          <PlayButton movieId={data?.id} />
          <button
            onClick={handleOpenModal}
            className="flex flex-row items-center w-auto px-2 py-1 text-xs font-semibold text-white transition bg-white rounded-md bg-opacity-30 md:py-2 md:px-4 lg:text-lg hover:bg-opacity-20"
          >
            <AiOutlineInfoCircle size={30} className="mr-1" />
            More info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billboard;
