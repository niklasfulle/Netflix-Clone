import { create } from "zustand"

export interface ModalStoreInterdace {
  profilImg?: string;
  isOpen: boolean;
  openModal: (movieId: string) => void;
  closeModal: () => void;
}

const useProfilModal = create<ModalStoreInterdace>((set) => ({
  profilImg: undefined,
  isOpen: false,
  openModal: (profilImg: string) => set({ isOpen: true, profilImg }),
  closeModal: () => set({ isOpen: false, profilImg: undefined })
}))

export default useProfilModal