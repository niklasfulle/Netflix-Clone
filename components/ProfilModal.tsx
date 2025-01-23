import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { FaArrowRight, FaUserCheck } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

import useProfilImgsApi from '@/hooks/useProfilImgsApi';

interface ProfilModalProps {
  visible?: boolean;
  onClose: any;
  ProfilImg: string;
  setProfilImg: any;
}

const ProfilModal: React.FC<ProfilModalProps> = ({
  visible,
  onClose,
  ProfilImg,
  setProfilImg,
}) => {
  const [isVisible, setIsVisible] = useState(!!visible);
  const [imgIndex, setImgIndex] = useState(1);
  const { data: profilImgs } = useProfilImgsApi();
  const [displayImg, setDisplayImg] = useState(ProfilImg);

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const rotateProfilImgs = () => {
    if (profilImgs != undefined) {
      if (imgIndex + 1 < profilImgs.length) {
        setImgIndex(imgIndex + 1);
      } else {
        setImgIndex(0);
      }
    }

    setDisplayImg(profilImgs[imgIndex].url);
  };

  const saveProfilImg = (displayImg: string) => {
    setProfilImg(displayImg);
    handleClose();
  };

  if (!visible || profilImgs == undefined) {
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
          <div className="relative h-80 min-w-[25rem]">
            <IoClose
              onClick={handleClose}
              className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 top-2 hover:text-neutral-300"
              size={30}
            />
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  saveProfilImg(displayImg);
                }}
                className="flex items-center justify-center w-12 h-12 mt-20 mr-6 transition delay-200 rounded-full cursor-pointer group hover:bg-neutral-800"
              >
                <FaUserCheck
                  className="ml-1 text-white transition-all ease-in delay-200 hover:text-neutral-300"
                  size={25}
                />
              </button>
              <div className="relative flex items-center justify-center mt-[4.5rem] overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                <Image
                  src={`/images/profil/${displayImg}`}
                  alt="Profile"
                  width={320}
                  height={320}
                />
              </div>
              <button
                onClick={() => {
                  rotateProfilImgs();
                }}
                className="flex items-center justify-center w-12 h-12 mt-20 ml-6 transition delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 hover:bg-neutral-800"
              >
                <FaArrowRight
                  className="text-white transition-all ease-in delay-200 hover:text-neutral-300"
                  size={25}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilModal;
