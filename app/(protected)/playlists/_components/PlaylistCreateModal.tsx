import { useCallback, useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import { AddPlaylistForm } from './add-playlist-form';

interface PlaylistCreateModalProps {
  visible?: boolean;
  onClose: any;
}

const PlaylistCreateModal: React.FC<PlaylistCreateModalProps> = ({
  visible,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(!!visible);

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose();
    location.reload();
  }, [onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto transition duration-300 bg-black bg-opacity-80 pb-32 px-1">
      <div className="relative w-auto max-w-3xl mx-auto overflow-hidden rounded-md">
        <div
          className={`${
            isVisible ? "scale-100" : "scale-0"
          } transform duration-300 relative flex-auto bg-zinc-900 drop-shadow-md`}
        >
          <div className="relative min-w-[35rem]">
            <IoClose
              onClick={handleClose}
              className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 top-2 hover:text-neutral-300"
              size={30}
            />
            <div className="flex flex-col items-center py-10">
              <h1 className="text-3xl text-center text-white md:text-4xl">
                Create Playlist
              </h1>
              <AddPlaylistForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlaylistCreateModal;
