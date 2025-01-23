import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';

interface PlaylistAddCardProps {
  openModalCreate: any;
}

const PlaylistAddCard: React.FC<PlaylistAddCardProps> = ({
  openModalCreate,
}) => {
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
    <button
      className="group bg-zinc-800 col-span relative h-[20vw] lg:h-[12vw] flex flex-row items-center justify-center rounded-t-md cursor-pointer"
      onClick={() => openModalCreate()}
    >
      <FaPlus className="text-white group-hover:text-neutral-300 " size={45} />
    </button>
  );
};

export default PlaylistAddCard;
