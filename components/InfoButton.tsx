import React, { useCallback } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

import useInfoModal from '@/hooks/useInfoModal';

interface InfoButtonProps {
  movieId: string;
}

const InfoButton: React.FC<InfoButtonProps> = ({ movieId }) => {
  const { openModal } = useInfoModal();

  const handleOpenModal = useCallback(() => {
    openModal(movieId);
  }, [openModal, movieId]);

  return (
    <button
      onClick={handleOpenModal}
      className="flex items-center justify-center h-10 w-10 transition border-2 border-white rounded-full cursor-pointer group/item  hover:border-neutral-300"
    >
      <AiOutlineInfoCircle
        size={20}
        className="m-1 md:m-0 md:mr-2 hidden md:block"
      />
      <AiOutlineInfoCircle
        size={30}
        className="m-1 md:m-0 md:mr-2 md:hidden block"
      />
      <p className="hidden md:block">More info</p>
    </button>
  );
};

export default InfoButton;
