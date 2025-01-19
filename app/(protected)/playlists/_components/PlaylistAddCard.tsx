import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

interface PlaylistAddCardProps {
  openModal: any;
}

const PlaylistAddCard: React.FC<PlaylistAddCardProps> = ({ openModal }) => {
  const [isDesktop, setIsDesktop] = useState(true);

  const checkWindowSize = () => {
    let windowWidth: number = 0; // Initialize with a default value
    if (typeof window !== "undefined") {
      windowWidth = window.innerWidth;
    }
    if (windowWidth >= 640) {
      setIsDesktop(true);
    } else {
      setIsDesktop(false);
    }
  };

  useEffect(() => {
    checkWindowSize();
  }, [isDesktop]);

  return (
    <div
      className="group bg-zinc-800 col-span relative h-[20vw] lg:h-[12vw] flex flex-row items-center justify-center rounded-t-md cursor-pointer"
      onClick={() => openModal()}
    >
      <FaPlus className="text-white group-hover:text-neutral-300 " size={45} />
    </div>
  );
};

export default PlaylistAddCard;
