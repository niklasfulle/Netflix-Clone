import { create } from "zustand"

export interface ModalStoreInterdace {
  isOpen: boolean;
  openModal: (movieId: string) => void;
  closeModal: () => void;
}

const usePlaylistModal = create<ModalStoreInterdace>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false })
}))

export default usePlaylistModal