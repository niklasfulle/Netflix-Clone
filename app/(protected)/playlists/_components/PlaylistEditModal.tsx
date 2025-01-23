"use client";
import { useCallback, useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import usePlaylist from '@/hooks/playlists/usePlaylist';
import useUpdatePlaylistModal from '@/hooks/playlists/useUpdatePlaylistModal';

import { UpdatePlaylistForm } from './update-playlist-form';

interface PlaylistEditModalProps {
  visible?: boolean;
  onClose: any;
}

const PlaylistEditModal: React.FC<PlaylistEditModalProps> = ({
  visible,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(!!visible);
  const { playlistId } = useUpdatePlaylistModal();
  const { data: playlist } = usePlaylist(playlistId);

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
          <div className="relative min-w-[25rem]">
            <IoClose
              onClick={handleClose}
              className="absolute z-10 text-white transition-all ease-in cursor-pointer right-2 top-2 hover:text-neutral-300"
              size={30}
            />
            <div className="flex flex-col items-center py-10 px-10">
              <h1 className="text-3xl text-center text-white md:text-4xl">
                Update Playlist
              </h1>
              <UpdatePlaylistForm playlist={playlist} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlaylistEditModal;
