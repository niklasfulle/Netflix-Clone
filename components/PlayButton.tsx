'use client';

import Link from 'next/link';
import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

interface PlayButtonProps {
  movieId: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ movieId }) => {
  const pathname = usePathname();
  
  return (
    <Link href={`/watch/${movieId}?from=${encodeURIComponent(pathname)}`}>
      <div className="flex flex-row items-center p-1 md:p-2 h-10 w-10 md:w-auto justify-center text-md font-semibold transition bg-white rounded-full md:rounded-md cursor-pointer lg:text-lg hover:bg-neutral-400">
        <FaPlay size={20} className="m-1 md:m-0 md:mr-2 mr-0.5" />
        <p className="hidden md:block">Play</p>
      </div>
    </Link>
  );
};

export default PlayButton;
