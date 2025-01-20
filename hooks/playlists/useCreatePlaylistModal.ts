import { create } from "zustand"

export interface ModalStoreInterdace {
  isOpen: boolean;
  openModal: (movieId: string) => void;
  closeModal: () => void;
}

const useCreatePlaylistModal = create<ModalStoreInterdace>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false })
}))

export default useCreatePlaylistModal