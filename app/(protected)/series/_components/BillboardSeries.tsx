import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import BillboardInfoButton from '@/components/BillboardInfoButton';
import BillboardPlayButton from '@/components/BillboardPlayButton';
import useBillboradSeries from '@/hooks/series/useBillboradSeries';

const BillboardSeries = () => {
  const { data, isLoading } = useBillboradSeries();
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

  return (
    <div className="relative h-[56.25vw]">
      {isLoading && (
        <div className="flex items-center justify-center w-full h-[56.25vw] bg-zinc-800 aspect-video">
          <svg
            className="w-10 h-10 text-zinc-500 dark:text-gray-600"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
        </div>
      )}
      {!isLoading && isDesktop && (
        <video
          className="w-full h-[56.25vw] object-cover brightness-[60%] aspect-video"
          autoPlay
          muted
          loop
          poster={data?.thumbnailUrl}
          src={data?.id ? `/api/video/billboard/${data.id}` : undefined}
        />
      )}
      {!isLoading && !isDesktop && (
        <Image
          className="w-full h-[60.25vw] object-cover brightness-[60%] aspect-video"
          src={data?.thumbnailUrl}
          height={1080}
          width={1920}
          alt="Thumbnail"
        />
      )}
      <div className="absolute top-[50%] md:top-[40%] ml-4 md:ml-16 max-w-[60%]">
         <p className="w-full font-bold text-white text-2xl md:text-5xl lg:text-6xl drop-shadow-xl overflow-hidden text-ellipsis line-clamp-2">
          {data?.title}
        </p>
        {data?.description != "test" && (
          <p className="text-white text-[8px] text-lg mt-3 md:mt-8 w-[90%] md:w-[80%] lg:w-[90%] drop-shadow-xl overflow-hidden text-ellipsis line-clamp-3 max-h-20">
            {data?.description.substring(0, 250)}
            {data?.description.length >= 140 && "..."}
          </p>
        )}
        {data?.description == "test"}
        <div className="flex flex-row items-center gap-3 mt-3 md:mt-4">
          <BillboardPlayButton movieId={data?.id} />
          <BillboardInfoButton movieId={data?.id} />
        </div>
      </div>
    </div>
  );
};

export default BillboardSeries;
