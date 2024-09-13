import PlayButton from "./PlayButton";
import FavoriteButton from "./FavoriteButton";
import useInfoModal from "@/hooks/useInfoModal";
import useMovie from "@/hooks/movies/useMovie";
import { useCallback, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { FaUndo } from "react-icons/fa";
import { useRouter } from "next/router";
import Image from "next/image";

interface InfoModalProps {
  visible?: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose }) => {
  const [isVisible, setIsVisible] = useState(!!visible);
  const { movieId } = useInfoModal();
  const { data = {} } = useMovie(movieId);
  const router = useRouter();
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

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!visible) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto transition duration-300 bg-black bg-opacity-80">
      <div className="relative w-auto max-w-3xl mx-auto overflow-hidden rounded-md">
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
            <div
              onClick={handleClose}
              className="absolute flex items-center justify-center w-10 h-10 bg-black rounded-full cursor-pointer top-3 right-3 bg-opacity-70"
            >
              <AiOutlineClose className="text-white" size={20} />
            </div>
            <div className="absolute bottom-[24%] md:bottom-[10%] left-10">
              <p className="h-full mb-8 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {data?.title}
              </p>
              <div className="flex flex-row gap-4 justify-items-start">
                <PlayButton movieId={data?.id} />
                <div
                  className="flex items-center justify-center w-8 h-8 transition border-2 border-white rounded-full cursor-pointer group/item lg:w-10 lg:h-10 hover:border-neutral-300"
                  onClick={() => router.push(`/watch/${data?.id}?start=0`)}
                >
                  <FaUndo size={18} className="mt-0.5 text-white" />
                </div>
                <FavoriteButton movieId={data?.id} />
              </div>
            </div>
          </div>
          <div className="px-12 py-8">
            <p className="text-lg font-semibold text-green-400">
              New <span className="ml-4 text-white">{data?.title}</span>
            </p>
            <div className="flex flex-row gap-8 mt-3">
              <p className="text-lg text-white">{data?.duration}</p>
              <p className="text-lg text-white">{data?.genre}</p>
              <p className="text-lg text-white">{data?.actor}</p>
            </div>
            {data?.description != "test" && (
              <p className="text-lg text-white">{data?.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default InfoModal;
