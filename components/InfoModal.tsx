"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

import FavoriteButton from "@/components/FavoriteButton";
import useMovie from "@/hooks/movies/useMovie";
import useMovieViews from "@/hooks/movies/useMovieViews";
import useInfoModal from "@/hooks/useInfoModal";

import PlayButton from "./PlayButton";
import PlaylistSelect from "./PlaylistSelect";
import RestartButton from "./RestartButton";
import EditMovieButton from "./EditMovieButton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
  playlists: any[];
}

const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  onClose,
  playlists,
}) => {
  const [isVisible, setIsVisible] = useState(!!visible);
  const [isDesktop, setIsDesktop] = useState(true);
  const { movieId } = useInfoModal();
  const { data: movie } = useMovie(movieId);
  const { data: views } = useMovieViews(movieId);
  const user = useCurrentUser();
  const router = useRouter();

  const checkWindowSize = () => {
    let windowWidth: number = 0; // Initialize with a default value
    if (globalThis.window !== undefined) {
      windowWidth = globalThis.window.innerWidth;
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

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const linkToSearch = (actor: string) => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 10);
    if (actor != "") router.push(`/search/${actor}`);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 px-1 sm:px-0 sm:mt-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto transition duration-300 bg-black bg-opacity-80">
      <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-2xl shadow-2xl border border-zinc-800">
        <div
          className={`$${
            isVisible ? "scale-100" : "scale-0"
          } transform duration-300 relative flex-auto bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 drop-shadow-2xl`}
        >
          <div className="relative h-96">
            {isDesktop && (
              <video
                className="w-full brightness-[60%] object-cover aspect-video h-full rounded-t-2xl"
                autoPlay
                muted
                loop
                poster={movie?.thumbnailUrl}
                src={movie?.id ? `/api/video/billboard/${movie.id}` : undefined}
              ></video>
            )}
            {!isDesktop && (
              <Image
                className="w-full brightness-[60%] object-cover h-[60%] md:h-[75%] rounded-t-2xl"
                src={movie?.thumbnailUrl}
                height={1080}
                width={1920}
                alt="Thumbnail"
              />
            )}
            <button
              onClick={handleClose}
              className="absolute flex items-center justify-center w-10 h-10 bg-black rounded-full cursor-pointer top-3 right-3 bg-opacity-70 border border-zinc-700 hover:bg-zinc-800 transition"
            >
              <AiOutlineClose className="text-white" size={20} />
            </button>
            <div className="absolute bottom-[24%] md:bottom-[10%] left-10">
              <p className="h-full mb-8 text-4xl font-extrabold text-white md:text-5xl drop-shadow-lg">
                {movie?.title}
              </p>
              <div className="flex flex-row gap-4 items-center mt-2">
                {movie?.id && (
                  <>
                    <PlayButton movieId={movie?.id} />
                    <RestartButton movieId={movie?.id} />
                    <FavoriteButton movieId={movie?.id} />
                    {user.role == UserRole.ADMIN && (
                      <EditMovieButton movieId={movie?.id} />
                    )}
                  </>
                )}
              </div>
            </div>
            {typeof views?.count === 'number' && (
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 rounded-full px-4 py-1 text-white text-sm font-semibold border border-zinc-700 shadow">
                👁️ {views.count} Views
              </div>
            )}
          </div>
          <div className="px-12 sm:pt-8 -mt-20 sm:mt-0 pb-4">
            {/* Titel in eigene Zeile */}
            <div className="mb-2">
              <span className="block text-2xl font-bold text-white w-full">{movie?.title}</span>
            </div>
            {/* Metadaten in separater Zeile */}
            <div className="flex flex-row flex-wrap items-center gap-6 mb-2">
              <span className="text-base text-zinc-400">{movie?.duration}</span>
              <span className="text-base text-zinc-400">{movie?.genre}</span>
              {Array.isArray(movie?.actors) && movie.actors.length > 0 && (
                <>
                  {movie.actors.map((actor: any, idx: number) => {  
                    let actorName = '';
                    let key = '';
                    if (typeof actor === 'string') {
                      actorName = actor;
                      key = actor;
                    } else if (actor?.name && actor?.id) {
                      actorName = actor.name;
                      key = actor.id;
                    } else if (actor?.actor?.name && actor?.actor?.id) {
                      actorName = actor.actor.name;
                      key = actor.actor.id;
                    } else {
                      return null;
                    }
                    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        linkToSearch(actorName);
                      }
                    };
                    return (
                      <a
                        key={key}
                        href={`/search/${encodeURIComponent(actorName)}`}
                        onClick={e => {
                          e.preventDefault();
                          linkToSearch(actorName);
                        }}
                        onKeyDown={handleKeyDown}
                        className="text-base text-blue-400 underline underline-offset-2 cursor-pointer hover:text-blue-300 mr-2"
                        tabIndex={0}
                      >
                        {actorName}
                      </a>
                    );
                  })}
                </>
              )}
            </div>
            {movie?.description && movie?.description !== "test" && (
              <p className="text-lg text-zinc-200 mb-4 whitespace-pre-line leading-relaxed">{movie?.description}</p>
            )}
          </div>
          <div className="px-12 pb-6">
            <PlaylistSelect playlists={playlists} movieId={movieId as string} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default InfoModal;
