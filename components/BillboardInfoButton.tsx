import React, { useCallback } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

import useInfoModal from '@/hooks/useInfoModal';

interface BillboardInfoButtonProps {
  movieId: string;
}

const BillboardInfoButton: React.FC<BillboardInfoButtonProps> = ({
  movieId,
}) => {
  const { openModal } = useInfoModal();

  const handleOpenModal = useCallback(() => {
    openModal(movieId);
  }, [openModal, movieId]);

  return (
    <button
      onClick={handleOpenModal}
      className="flex flex-row items-center justify-center p-0 md:p-2 text-md h-10 md:h-auto w-10 md:w-auto text-white font-semibold transition bg-white/30 rounded-full md:rounded-md cursor-pointer lg:text-lg hover:bg-neutral-400/30"
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

export default BillboardInfoButton;
