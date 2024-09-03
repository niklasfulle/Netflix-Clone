import useProfilImgsApi from "@/hooks/useProfilImgsApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

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
  const [imgIndex, setImgIndex] = useState(0);
  const { data: profilImgs } = useProfilImgsApi();
  const [test, setTest] = useState(ProfilImg);

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const rotateProfilImgs = (rotation: string) => {
    console.log(profilImgs);
    if (profilImgs != undefined) {
      if (rotation == "right") {
        if (imgIndex + 1 < profilImgs.length) {
          setImgIndex(imgIndex + 1);
        } else {
          setImgIndex(0);
        }
      }
      if (rotation == "left") {
        if (imgIndex - 1 >= 0) {
          setImgIndex(imgIndex - 1);
        } else {
          setImgIndex(profilImgs.length);
        }
      }
    }

    setProfilImg(profilImgs[imgIndex].url);
    setTest(profilImgs[imgIndex].url);
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
          <div className="relative h-96 min-w-96">
            <IoClose
              onClick={handleClose}
              className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 top-2 hover:text-neutral-300"
              size={30}
            />
            <div className="flex items-center justify-center">
              <div
                onClick={() => {
                  setProfilImg(rotateProfilImgs("left"));
                }}
                className="flex items-center justify-center w-12 h-12 mt-20 mr-6 transition delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 hover:bg-neutral-800"
              >
                <FaArrowLeft
                  className="text-white transition-all ease-in delay-200 hover:text-neutral-300"
                  size={25}
                />
              </div>
              <div className="relative flex items-center justify-center mt-[4.5rem] overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                <img src={`/images/profil/${test}`} alt="Profile" />
              </div>
              <div
                onClick={() => {
                  setProfilImg(rotateProfilImgs("right"));
                }}
                className="flex items-center justify-center w-12 h-12 mt-20 ml-6 transition delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 hover:bg-neutral-800"
              >
                <FaArrowRight
                  className="text-white transition-all ease-in delay-200 hover:text-neutral-300"
                  size={25}
                />
              </div>
            </div>
            <div className="px-28">
              <button className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md hover:bg-red-700">
                Use
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilModal;
