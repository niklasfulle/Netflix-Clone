import { create } from "zustand"

export interface ModalStoreInterdace {
  playlistId?: string;
  isOpen: boolean;
  openModal: (movieId: string) => void;
  closeModal: () => void;
}

const useUpdatePlaylistModal = create<ModalStoreInterdace>((set) => ({
  playlistId: undefined,
  isOpen: false,
  openModal: (playlistId: string) => set({ isOpen: true, playlistId }),
  closeModal: () => set({ isOpen: false, playlistId: undefined })
}))

export default useUpdatePlaylistModal