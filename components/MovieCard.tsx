import Image from "next/image";
import React from "react";
import { FaChevronDown } from "react-icons/fa";
import useInfoModal from "@/hooks/useInfoModal";
import FavoriteButton from "./FavoriteButton";
import MovieCardPlayButton from "./MovieCardPlayButton";
import RestartButton from "./RestartButton";
import { useRouter } from "next/navigation";
import type { CatalogCardDto } from "@/lib/catalog";
import { useLanguage } from '@/components/providers/LanguageProvider';

interface MovieCardProps {
  data: CatalogCardDto;
  isLoading?: boolean;
  eager?: boolean;
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

  return Math.floor(watchTime / (sec! / 100));
}

const MovieCard: React.FC<MovieCardProps> = ({ data, isLoading = false, eager = false }) => {
  const barWidth: string =
    calculateBarWidth(data.duration ?? "0", data.watchTime ?? 0) + "%";
  const { openModal } = useInfoModal();
  const router = useRouter();
  const { message } = useLanguage();
  const contentTitle = data.title ?? message('untitledContent', {});

  const linkToSearch = (actor: string) => {
    if (actor !== "") router.push(`/search/${actor}`);
  };

  let actorsElement: React.ReactNode = null;
  const actors = data.actors ?? [];
  if (actors.length > 0) {
    actorsElement = (
      <span>
        {actors.map((a, idx: number) => {
          let actorName = '';
          let key = '';
          if (typeof a === 'string') {
            actorName = a;
            key = a;
          } else if (a?.id && a?.name) {
            actorName = a.name;
            key = a.id;
          } else if (a?.actor?.name && a?.actor?.id) {
            actorName = a.actor.name;
            key = a.actor.id;
          } else {
            return null;
          }
          return (
            <a
              key={key}
              href={`/search/${encodeURIComponent(actorName)}`}
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                linkToSearch(actorName);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  linkToSearch(actorName);
                }
              }}
              className="text-white text-[10px] text-base lg:text-sm md:text-center underline underline-offset-1 cursor-pointer mr-1"
            >
              {actorName}{idx < actors.length - 1 ? '  ' : ''}
            </a>
          );
        })}
      </span>
    );
  } else if (data.actor) {
    const actor = data.actor;
    actorsElement = (
      <a
        href={`/search/${encodeURIComponent(actor)}`}
        tabIndex={0}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          linkToSearch(actor);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            linkToSearch(actor);
          }
        }}
        className="text-white text-[10px] text-base lg:text-sm md:text-center underline underline-offset-1 cursor-pointer"
      >
        {actor}
      </a>
    );
  }

  return (
    <article className="group bg-zinc-900 col-span relative h-[24vw] lg:h-[12vw]">
      <div className="relative rounded-md">
        <button
          type="button"
          onClick={() => data.id && openModal(data.id)}
          className="block w-full rounded-t-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          aria-label={message('showDetails', { title: contentTitle })}
        >
          {isLoading && (
            <div className="flex items-center justify-center w-full transition shadow-xl object-cover duration max-w-64 aspect-video rounded-t-md bg-zinc-800">
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
              className="object-cover transition duration shadow-xl rounded-t-md sm:group-hover:opacity-90 w-full h-[24vw] lg:h-[12vw] bg-black"
              src={data.thumbnailUrl ?? '/images/Logo2.png'}
              alt={message('thumbnailAlt', { title: contentTitle })}
              width={1920}
              height={1080}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading={eager ? 'eager' : 'lazy'}
            />
          )}
        </button>
        {data.watchTime != undefined && (
          <>
            <div
              className="absolute z-10 h-1 bg-red-600 sm:group-hover:hidden bottom-[0px]"
              style={{
                width: barWidth,
              }}
            ></div>
            <div className="absolute w-full h-1 bg-black sm:group-hover:hidden bottom-[0px]"></div>
          </>
        )}
      </div>
      <div className="z-50 opacity-0 absolute top-0 transition duration-200 scale-0 sm:group-hover:scale-100 sm:group-hover:-translate-y-[6vw] min-w-2/3 lg:w-full sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => data.id && openModal(data.id)}
          aria-label={message('showDetails', { title: contentTitle })}
          className="block w-full rounded-t-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
        >
          <Image
            className="object-cover aspect-video transition duration shadow-xl rounded-t-md min-w-2/3 lg:w-full h-[20vw] lg:h-[12vw] bg-black"
            src={data.thumbnailUrl ?? '/images/Logo2.png'}
            alt=""
            width={1920}
            height={1080}
            sizes="(max-width: 1024px) 50vw, 20vw"
            loading="lazy"
          />
        </button>
        <div className="absolute z-10 w-full p-2 transition shadow-md max-h-52 lg:h-auto bg-zinc-800 lg:p-4 rounded-b-md">
          <div className="flex flex-row items-center gap-3">
            <div className="flex flex-row xl:gap-4 gap-3 items-center">
              <MovieCardPlayButton movieId={data.id ?? ''} />
              <RestartButton movieId={data.id ?? ''} />
              <FavoriteButton movieId={data.id ?? ''} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (data.id) openModal(data.id);
                }}
                className="flex items-center justify-center h-10 w-10 lg:p-1 transition border-2 border-white rounded-full cursor-pointer group/item hover:border-neutral-300"
                aria-label={message('moreInformation', { title: contentTitle })}
              >
                <FaChevronDown
                  className="text-white sm:group-hover/item:text-neutral-300 mt-0.5"
                  size={20}
                />
              </button>
            </div>
          </div>
          <p className="hidden mt-4 font-semibold lg:block text-left">
            <span className=" text-white">{data.title}</span>
          </p>
          <p className="block mt-2 font-semibold text-white lg:hidden">
            {data.title}
          </p>
          <div className="flex flex-col pb-4 mt-4 md:gap-8 md:flex-row ">
            <p className="text-white text-[10px] text-base lg:text-sm">
              {data.duration}
            </p>
            <p className="text-white text-[10px] text-base lg:text-sm">
              {data.genre}
            </p>
            {actorsElement}
          </div>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
