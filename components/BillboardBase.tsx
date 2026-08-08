import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import BillboardInfoButton from '@/components/BillboardInfoButton';
import BillboardPlayButton from '@/components/BillboardPlayButton';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';
import { useBillboardVideoAvailability } from '@/hooks/useBillboardVideoAvailability';

interface BillboardBaseProps {
  data?: CatalogItemDto | null;
  isLoading: boolean;
  priority?: boolean;
}

const BillboardBase: React.FC<BillboardBaseProps> = ({ data, isLoading, priority }) => {
  const [isDesktop, setIsDesktop] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const checkWindowSize = () => {
      setIsDesktop(globalThis.window.innerWidth >= 1024);
    };

    checkWindowSize();
    globalThis.window.addEventListener('resize', checkWindowSize);
    return () => globalThis.window.removeEventListener('resize', checkWindowSize);
  }, []);

  useEffect(() => {
    setVideoFailed(false);
  }, [data?.id]);

  const videoAvailable = useBillboardVideoAvailability(
    data?.id,
    !isLoading && isDesktop,
  );

  const playVideo = (video: HTMLVideoElement) => {
    const playAttempt = video.play();
    playAttempt?.catch(() => undefined);
  };

  const hasPoster = Boolean(data?.thumbnailUrl);
  const showVideo = !isLoading && isDesktop && videoAvailable && !videoFailed;
  const showPoster = !isLoading && hasPoster && (!showVideo || videoFailed);

  return (
    <div className="relative h-[56.25vw] w-full overflow-hidden">
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
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
      {showVideo && (
        <video
          key={data?.id}
          className="absolute inset-0 h-full w-full object-cover brightness-[60%]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={data?.thumbnailUrl}
          src={data?.id ? `/api/video/billboard/${data.id}` : undefined}
          onCanPlay={(event) => playVideo(event.currentTarget)}
          onError={() => setVideoFailed(true)}
        />
      )}
      {showPoster && (
        <Image
          className="absolute inset-0 h-full w-full object-cover brightness-[60%]"
          src={data?.thumbnailUrl ?? ''}
          height={1080}
          width={1920}
          alt="Thumbnail"
          priority={priority}
        />
      )}
      {!isLoading && !showVideo && !showPoster && (
        <div className="h-full w-full bg-zinc-900" aria-hidden="true" />
      )}
      <div
        className="absolute top-[50%] md:top-[40%] ml-4 md:ml-16 max-w-[60%]"
        data-testid="billboard-content"
      >
         <p className="w-full font-bold text-white text-2xl md:text-5xl lg:text-6xl drop-shadow-xl overflow-hidden text-ellipsis line-clamp-2">
          {data?.title}
        </p>
        {data?.description != "test" && (
          <p className="text-white text-[8px] text-lg mt-3 md:mt-8 w-[90%] md:w-[80%] lg:w-[90%] drop-shadow-xl overflow-hidden text-ellipsis line-clamp-3 max-h-20">
            {data?.description?.substring(0, 250)}
            {(data?.description?.length ?? 0) >= 140 && "..."}
          </p>
        )}
        {!isLoading && data?.id && (
          <div className="flex flex-row items-center gap-3 mt-3 md:mt-4 z-10">
            <BillboardPlayButton movieId={data.id} />
            <BillboardInfoButton movieId={data.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillboardBase;
