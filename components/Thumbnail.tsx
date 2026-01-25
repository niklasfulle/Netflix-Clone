import Image from 'next/image';

import useInfoModal from '@/hooks/useInfoModal';

interface ThumbnailProps {
  data: Record<string, any>;
  isLoading: boolean;
}

function calculateBarWidth(duration: string, watchTime: number): number {
  const i: string[] = duration.split(":");
  let sec: number;
  if (i.length == 1) {
    sec = Number.parseInt(i[0]);
  } else if (i.length == 2) {
    sec = Number.parseInt(i[0]) * 60 + Number.parseInt(i[1]);
  } else if (i.length == 3) {
    sec = Number.parseInt(i[0]) * 60 * 60 + Number.parseInt(i[1]) * 60 + Number.parseInt(i[2]);
  }

  return Math.floor(watchTime / (sec! / 100)) - 1.5;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ data, isLoading }) => {
  const { openModal } = useInfoModal();
  const barWidth: string =
    calculateBarWidth(data?.duration, data?.watchTime) + "%";

  return (
    <button
      className="relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105"
      onClick={() => openModal(data?.id)}
    >
      <div className="relative">
        {isLoading && (
          <div className="flex items-center justify-center w-full transition shadow-xl cursor-pointer oobject-cover duration max-w-64 aspect-video rounded-t-md bg-zinc-800">
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
        {!isLoading && (
          <Image
            className="w-full transition shadow-xl cursor-pointer oobject-cover duration max-w-64 aspect-video rounded-t-md"
            src={data.thumbnailUrl}
            alt="Thumbnail"
            width={500}
            height={500}
          />
        )}
        {data.watchTime != undefined && (
          <>
            <div
              className="absolute z-10 h-1 bg-red-600 bottom-[0px]"
              style={{
                width: barWidth,
              }}
            ></div>
            <div className="absolute md:w-[98.5%] w-full h-1 bg-black bottom-[0px]"></div>
          </>
        )}
      </div>
    </button>
  );
};

export default Thumbnail;
