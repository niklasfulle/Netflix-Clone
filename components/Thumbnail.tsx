import Image from 'next/image';

import useInfoModal from '@/hooks/useInfoModal';
import type { CatalogCardDto } from '@/lib/catalog';
import { getWatchProgress } from '@/lib/watch-progress';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface ThumbnailProps {
  data: CatalogCardDto;
  isLoading: boolean;
}

function calculateBarWidth(duration: string, watchTime: number): number {
  const progress = getWatchProgress(duration, watchTime);
  return Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.floor(progress * 100))) : 0;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ data, isLoading }) => {
  const { openModal } = useInfoModal();
  const { message } = useLanguage();
  const contentTitle = data.title ?? message('untitledContent', {});
  const barWidth: string =
    calculateBarWidth(data.duration ?? "0", data.watchTime ?? 0) + "%";

  return (
    <button
      type="button"
      className="relative h-28 w-[180px] min-w-[180px] shrink-0 cursor-pointer transition duration-200 ease-out md:h-36 md:w-[260px] md:min-w-[260px] md:hover:scale-105"
      onClick={() => data.id && openModal(data.id)}
      aria-label={message('showDetails', { title: contentTitle })}
    >
      <div className="relative h-full w-full">
        {isLoading && (
          <div className="flex h-full w-full items-center justify-center rounded-t-md bg-zinc-800 shadow-xl">
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
            className="h-full w-full rounded-t-md object-cover shadow-xl"
            src={data.thumbnailUrl ?? '/images/Logo2.png'}
            alt={message('thumbnailAlt', { title: contentTitle })}
            width={500}
            height={500}
            sizes="(min-width: 768px) 260px, 180px"
          />
        )}
        {data.watchTime != undefined && (
          <>
            <div
              className="absolute left-0 z-10 h-1 bg-red-600 bottom-[0px]"
              style={{
                width: barWidth,
              }}
            ></div>
            <div className="absolute left-0 w-full h-1 bg-black bottom-[0px]"></div>
          </>
        )}
      </div>
    </button>
  );
};

export default Thumbnail;
