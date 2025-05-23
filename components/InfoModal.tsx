"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

import FavoriteButton from "@/components/FavoriteButton";
import useMovie from "@/hooks/movies/useMovie";
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
  const user = useCurrentUser();
  const router = useRouter();

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
      <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-md">
        <div
          className={`${
            isVisible ? "scale-100" : "scale-0"
          } transform duration-300 relative flex-auto bg-zinc-900 drop-shadow-md`}
        >
          <div className="relative h-96">
            {isDesktop && (
              <video
                className="w-full brightness-[60%] object-cover aspect-video h-full"
                autoPlay
                muted
                loop
                poster={movie?.thumbnailUrl}
                src={movie?.videoUrl}
              ></video>
            )}
            {!isDesktop && (
              <Image
                className="w-full brightness-[60%] object-cover h-[60%] md:h-[75%]"
                src={movie?.thumbnailUrl}
                height={1080}
                width={1920}
                alt="Thumbnail"
              />
            )}
            <button
              onClick={handleClose}
              className="absolute flex items-center justify-center w-10 h-10 bg-black rounded-full cursor-pointer top-3 right-3 bg-opacity-70"
            >
              <AiOutlineClose className="text-white" size={20} />
            </button>
            <div className="absolute bottom-[24%] md:bottom-[10%] left-10">
              <p className="h-full mb-8 text-3xl font-bold text-white md:text-4xl">
                {movie?.title}
              </p>
              <div className="flex flex-row gap-4 items-center">
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
          </div>
          <div className="px-12 sm:pt-8 -mt-20 sm:mt-0 pb-4">
            <p className="text-lg font-semibold ">
              <span className="text-white">{movie?.title}</span>
            </p>
            <div className="flex flex-row gap-8 mt-3">
              <p className="text-lg text-white">{movie?.duration}</p>
              <p className="text-lg text-white">{movie?.genre}</p>

              <p
                onClick={() => linkToSearch(movie?.actor)}
                className="text-lg text-white underline underline-offset-1 cursor-pointer"
                role="link"
              >
                {movie?.actor}
              </p>
            </div>
            {movie?.description != "test" && (
              <p className="text-lg text-white">{movie?.description}</p>
            )}
          </div>
          <PlaylistSelect playlists={playlists} movieId={movieId as string} />
        </div>
      </div>
    </div>
  );
};
export default InfoModal;
